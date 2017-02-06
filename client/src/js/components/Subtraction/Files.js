import React from "react";
import Request from "superagent";
import { Uploader } from "virtool/js/components/Base";

export const getFiles = () => dispatcher.db.files.chain().find({file_type: "subtraction"});

export default class SubtractionFiles extends React.Component {

    constructor (props) {
        super(props);
        this.state = {
            documents: getFiles()
        };
    }

    static propTypes = {
        route: React.PropTypes.object
    };

    componentDidMount () {
        dispatcher.db.files.on("change", this.update);
    }

    componentWillUnmount () {
        dispatcher.db.files.off("change", this.update);
    }

    upload = (files) => {
        files.forEach(file => {
            dispatcher.db.samples.request("authorize_upload", {name: file.name, size: file.size })
                .success(data => {
                    Request.post(`/upload/${data.file_id}`)
                        .send(file)
                        .end();
                });
        });
    };

    remove = (file_id) => {
        dispatcher.db.files.request("remove_file", {
            "file_id": file_id
        });
    };

    update = () => {
        this.setState({
            documents: getFiles()
        });
    };

    render () {
        return <Uploader fileDocuments={this.state.documents} onDrop={this.upload} onRemove={this.remove}/>;
    }

}
