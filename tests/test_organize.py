import pymongo
import pytest
from aiohttp.test_utils import make_mocked_coro

import virtool.organize

ORIGINAL_REFERENCE = {
    "id": "original"
}


async def test_add_original_reference(dbi):
    await dbi.analyses.insert_many([
        {
            "_id": "baz"
        },
        {
            "_id": "hello_world"
        }
    ])

    await virtool.organize.add_original_reference(dbi.analyses)

    assert await dbi.analyses.find().to_list(None) == [
        {
            "_id": "baz",
            "reference": ORIGINAL_REFERENCE
        },
        {
            "_id": "hello_world",
            "reference": ORIGINAL_REFERENCE
        }
    ]


async def test_delete_unready(dbi):
    await dbi.analyses.insert_many([
        {
            "_id": 1,
            "ready": True
        },
        {
            "_id": 2,
            "ready": False
        }
    ])

    await virtool.organize.delete_unready(dbi.analyses)

    assert await dbi.analyses.find().to_list(None) == [
        {
            "_id": 1,
            "ready": True
        }
    ]


async def test_organize_analyses(dbi):
    """
    Test that documents with the ``ready`` field set to ``False`` are deleted from the collection. These documents
    are assumed to be associated with defunct analysis jobs.

    """
    await dbi.analyses.insert_many([
        {
            "_id": 1,
            "ready": True
        },
        {
            "_id": 2,
            "ready": False
        },
        {
            "_id": 3,
            "ready": True
        },
        {
            "_id": 4,
            "ready": False
        }
    ])

    await virtool.organize.organize_analyses(dbi)

    assert await dbi.analyses.find().to_list(None) == [
        {
            "_id": 1,
            "ready": True,
            "reference": {
                "id": "original"
            }
        },
        {
            "_id": 3,
            "ready": True,
            "reference": {
                "id": "original"
            }
        }
    ]


async def test_organize_files(dbi):
    documents = [
        {"_id": 1},
        {"_id": 2},
        {"_id": 3, "reserved": False},
        {"_id": 4, "reserved": True}
    ]

    await dbi.files.insert_many(documents)

    await virtool.organize.organize_files(dbi)

    async for document in dbi.files.find():
        assert document["reserved"] is False


async def test_organize_groups(dbi):

    await dbi.groups.insert_many([
        {
            "_id": "administrator"
        },
        {
            "_id": "foobar",
            "permissions": {
                "hello_world": True,
                "create_sample": True
            }
        }
    ])

    await virtool.organize.organize_groups(dbi)

    documents = await dbi.groups.find().to_list(None)

    assert documents == [{
        "_id": "foobar",
        "permissions": {
            "cancel_job": False,
            "create_ref": False,
            "create_sample": True,
            "modify_hmm": False,
            "modify_subtraction": False,
            "remove_file": False,
            "remove_job": False,
            "upload_file": False
        }
    }]


async def test_organize_indexes(mocker):
    m_add_original_reference = mocker.patch("virtool.organize.add_original_reference", new=make_mocked_coro())
    m_db = mocker.Mock()

    await virtool.organize.organize_indexes(m_db)

    m_add_original_reference.assert_called_with(m_db.motor_client.indexes)


@pytest.mark.parametrize("has_otu", [True, False])
@pytest.mark.parametrize("has_references", [True, False])
async def test_organize_references(has_references, has_otu, mocker, dbi):
    if has_otu:
        await dbi.otus.insert_one({
            "_id": "foobar"
        })

    if has_references:
        await dbi.references.insert_one({
            "_id": "baz"
        })

    m = mocker.patch("virtool.db.references.create_original", new=make_mocked_coro())

    settings = {
        "default_source_types": [
            "culture",
            "strain"
        ]
    }

    await virtool.organize.organize_references(dbi, settings)

    document = await dbi.references.find_one()

    if has_otu and not has_references:
        assert document is None
        m.assert_called_with(dbi.motor_client, settings)

    else:
        assert not m.called

    if has_references:
        assert await dbi.references.find_one() == {
            "_id": "baz"
        }


@pytest.mark.parametrize("collection_name", [None, "viruses", "kinds"])
async def test_organize_otus(collection_name, test_motor):
    if collection_name is not None:
        await getattr(test_motor, collection_name).insert_many([
            {
                "_id": 1
            },
            {
                "_id": 2
            }
        ])

    await virtool.organize.organize_otus(test_motor)

    results = await test_motor.otus.find().to_list(None)

    if collection_name:
        assert results == [
            {
                "_id": 1
            },
            {
                "_id": 2
            }
        ]
    else:
        assert results == []

    assert "viruses" not in await test_motor.collection_names()


@pytest.mark.parametrize("has_software", [True, False])
@pytest.mark.parametrize("has_software_update", [True, False])
@pytest.mark.parametrize("has_version", [True, False])
async def test_organize_status(has_software, has_software_update, has_version, dbi):
    if has_software:
        await dbi.status.insert_one({
            "_id": "software",
            "version": "v2.2.2"
        })

    if has_software_update:
        await dbi.status.insert_one({"_id": "software_update"})

    if has_version:
        await dbi.status.insert_one({"_id": "version"})

    await virtool.organize.organize_status(dbi, "v3.0.0")

    expected_software = {
        "_id": "software",
        "process": None,
        "updating": False,
        "version": "v3.0.0"
    }

    if not has_software:
        expected_software.update({
            "installed": None,
            "releases": list()
        })

    assert await dbi.status.find({}, sort=[("_id", pymongo.ASCENDING)]).to_list(None) == [
        {
            "_id": "hmm",
            "installed": None,
            "process": None,
            "release": None,
            "updates": list()
        },
        expected_software
    ]


async def test_organize_subtraction(mocker):
    m_delete_unready = mocker.patch("virtool.organize.delete_unready", new=make_mocked_coro())

    m_db = mocker.Mock()

    await virtool.organize.organize_subtraction(m_db)

    assert m_delete_unready.call_args[0][0] == m_db.subtraction


async def test_organize_users(dbi):
    documents = [
        {
            "_id": "foo",
            "groups": [
                "test"
            ]
        },
        {
            "_id": "bar",
            "groups": [
                "test",
                "administrator"
            ]
        }
    ]

    await dbi.users.insert_many(documents)

    await virtool.organize.organize_users(dbi)

    documents[0].update({
        "groups": ["test"],
        "administrator": False
    })

    documents[1].update({
        "groups": ["test"],
        "administrator": True
    })

    assert await dbi.users.find().to_list(None) == documents
