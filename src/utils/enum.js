import _ from 'lodash';


export default class Enum {
    /**
     * makes sure that the user values are not included in the basic JS object keys (in order not to override them)
     * @param {string[]} values 
     */
    static validateValues(values) {
        const intersection = _.intersection(getAllObjectProperties({}), values);
        if (_.isEmpty(intersection)) {
            return;
        }
        throw new Error(`new Enum cannot receive basic JS object keys (${intersection}), in order not to override them.`);
    }

    /**
     * @param  {...string} values enum values. e.g. Days = new Enum('SUNDAY', 'MONDAY', 'TUESDAY', ...);
     */
    constructor(...values) {
        this.constructor.validateValues(values);
        _.extend(this, _.zipObject(values, _.map(values, Symbol)));
    }
}

function getAllObjectProperties(obj) {
    if (obj === null) {
        return [];
    }
    return _.concat(Object.getOwnPropertyNames(obj), getAllObjectProperties(Object.getPrototypeOf(obj)));
}