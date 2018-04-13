import os
import pytest
from concurrent.futures import ProcessPoolExecutor

import virtool.jobs.job
import virtool.jobs.build_index


@pytest.fixture
def test_rebuild_job(mocker, tmpdir, loop, test_motor, test_dispatch):
    tmpdir.mkdir("reference").mkdir("species")
    tmpdir.mkdir("logs").mkdir("jobs")

    executor = ProcessPoolExecutor()

    settings = {
        "data_path": str(tmpdir)
    }

    job = virtool.jobs.build_index.BuildIndex(
        loop,
        executor,
        test_motor,
        settings,
        test_dispatch,
        mocker.stub("capture_exception"),
        "foobar",
        "rebuild_index",
        dict(index_id="foobar"),
        1,
        4
    )

    return job


async def test_mk_index_dir(tmpdir, test_rebuild_job):
    await test_rebuild_job.mk_index_dir()

    assert os.listdir(os.path.join(str(tmpdir), "reference", "species")) == [
        "foobar"
    ]


@pytest.mark.parametrize("species_version", [1, 2])
async def test_write_fasta(species_version, test_motor, mocker, test_rebuild_job):
    m = mocker.stub(name="join")
    m = mocker.stub(name="patch_to_version")

    await test_motor.species.insert_one({
        "_id": "foobar",
        "version": species_version
    })

    mock_species = {
        "isolates": [
            {
                "default": True,
                "sequences": [
                    {
                        "_id": "foo",
                        "sequence": "ATAGAGATATAGAGACACACTTACTTATCA"
                    },
                    {
                        "_id": "bar",
                        "sequence": "GGCTTTCTCTATCAGGGAGGACTAGGCTAC"
                    }
                ]
            },
            {
                "default": True,
                "sequences": [
                    {
                        "_id": "baz",
                        "sequence": "ATAGAGATATAGAGACACACTTACTTATCA"
                    },
                    {
                        "_id": "test",
                        "sequence": "GGCTTTCTCTATCAGGGAGGACTAGGCTAC"
                    }
                ]
            }
        ]
    }

    async def join(*args):
        m(*args)
        return mock_species

    async def patch_to_version(*args):
        m(*args)
        return None, mock_species, None

    mocker.patch("virtool.db.history.patch_to_version", patch_to_version)
    mocker.patch("virtool.db.species.join", join)

    test_rebuild_job.task_args["species_manifest"] = {
        "foobar": 2
    }

    os.mkdir(test_rebuild_job.reference_path)

    await test_rebuild_job.write_fasta()

    with open(os.path.join(test_rebuild_job.reference_path, "ref.fa"), "r") as handle:
        assert handle.read() in [
            ">foo\nATAGAGATATAGAGACACACTTACTTATCA\n>bar\nGGCTTTCTCTATCAGGGAGGACTAGGCTAC\n",
            ">bar\nGGCTTTCTCTATCAGGGAGGACTAGGCTAC\n>foo\nATAGAGATATAGAGACACACTTACTTATCA\n"
        ]


@pytest.mark.parametrize("in_use", [True, False])
async def test_replace_old(in_use, mocker, tmpdir, test_motor, test_rebuild_job):
    m = mocker.Mock()

    async def run_in_executor(*args):
        return m(*args)

    mocker.patch.object(test_rebuild_job, "run_in_executor", run_in_executor)

    await test_motor.indexes.insert_many([
        {
            "_id": "foobar",
            "version": 2,
            "ready": False,
            "has_files": True
        },
        {
            "_id": "foo",
            "version": 1,
            "ready": True,
            "has_files": True
        },
        {
            "_id": "baz",
            "version": 0,
            "ready": True,
            "has_files": True
        }
    ])

    if in_use:
        await test_motor.analyses.insert_one({
            "_id": "test",
            "ready": False,
            "index": {
                "id": "foo"
            }
        })

    await test_rebuild_job.replace_old()

    assert await test_motor.indexes.find_one("foobar") == {
        "_id": "foobar",
        "version": 2,
        "ready": True,
        "has_files": True
    }

    expected = {"foo", "foobar"} if in_use else {"foobar"}

    assert m.called

    assert m.call_args[0][0:2] == (
        virtool.jobs.build_index.remove_unused_index_files,
        os.path.join(str(tmpdir), "reference", "species")
    )

    assert set(m.call_args[0][2]) == expected

    # Make sure that ``has_files`` was set to false for non-active indexes.
    assert set(await test_motor.indexes.find({"has_files": True}).distinct("_id")) == expected


async def test_cleanup(test_motor, test_rebuild_job):
    await test_motor.indexes.insert_one({"_id": "foobar"})

    await test_motor.history.insert_many([
        {
            "_id": "foo",
            "index": {
                "id": "foobar",
                "version": 2
            }
        },
        {
            "_id": "bar",
            "index": {
                "id": "foobar",
                "version": 2
            }
        },
        {
            "_id": "baz",
            "index": {
                "id": "aaa111",
                "version": 1
            }
        }
    ])

    os.mkdir(test_rebuild_job.reference_path)

    with open(os.path.join(test_rebuild_job.reference_path, "test.txt"), "w") as handle:
        handle.write("hello world")

    await test_rebuild_job.cleanup()

    assert not os.path.isdir(test_rebuild_job.reference_path)

    assert not await test_motor.indexes.count()

    assert await test_motor.history.count({"index.id": "unbuilt", "index.version": "unbuilt"}) == 2


def test_remove_unused_index_files(tmpdir):
    for path in ["anb763hj", "hd7hd902", "ab2c9081"]:
        tmpdir.mkdir(path).join("test.fa")

    base_path = str(tmpdir)

    virtool.jobs.build_index.remove_unused_index_files(base_path, ["anb763hj"])

    assert set(os.listdir(base_path)) == {"anb763hj"}
