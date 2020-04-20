import _ from 'lodash';


export default function getParsedResponse(rawResponse, parser) {
    if (_.isEmpty(rawResponse) || !_.isFunction(parser)) {
        return rawResponse;
    }
    if (_.isArray(rawResponse)) {
        return _.map(rawResponse, rawResponseItem => getParsedResponse(rawResponseItem, parser));
    }
    if (_.isFunction(parser.fromJSON)) {
        return parser.fromJSON(rawResponse);
    }
    try {
        return new parser(rawResponse);
    } catch (exception) {
        return parser(rawResponse);
    }
}