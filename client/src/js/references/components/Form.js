import React from "react";
import { map } from "lodash-es";
import { Row, Col } from "react-bootstrap";
import { InputError } from "../../base";

export default class ReferenceForm extends React.Component {

    render () {

        const acceptedDataTypes = [
            "",
            "genome"
        ];

        const dataOptions = map(acceptedDataTypes, (type) =>
            <option key={type} value={type} className="text-capitalize" hidden={!type.length}>
                {type}
            </option>
        );

        let extraComponent;

        if (this.props.state.errorFile != null || this.props.state.errorSelect != null) {
            extraComponent = (
                <Col xs={12}>
                    <div className="input-form-error">
                        <span className="input-error-message" style={{ margin: "0 0 0 0" }}>
                            {this.props.state.errorFile || this.props.state.errorSelect}
                        </span>
                    </div>
                </Col>
            );
        }

        return (
            <div>
                <Row>
                    {extraComponent}
                </Row>
                <Row>
                    <Col xs={12}>
                        <InputError
                            label="Name"
                            name="name"
                            value={this.props.state.name}
                            onChange={this.props.onChange}
                            error={this.props.state.errorName}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col xs={12}>
                        <InputError
                            label="Description"
                            type="textarea"
                            name="description"
                            value={this.props.state.description}
                            onChange={this.props.onChange}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col xs={12} md={6}>
                        <InputError
                            label="Data Type"
                            name="dataType"
                            type="select"
                            value={this.props.state.dataType}
                            onChange={this.props.onChange}
                            error={this.props.state.errorDataType}
                        >
                            {dataOptions}
                        </InputError>
                    </Col>
                    <Col xs={12} md={6}>
                        <InputError
                            label="Organism"
                            name="organism"
                            value={this.props.state.organism}
                            onChange={this.props.onChange}
                        />
                    </Col>
                </Row>
            </div>
        );
    }
}
