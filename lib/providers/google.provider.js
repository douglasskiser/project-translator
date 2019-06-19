
module.exports = ({projectId}) => {
    const {Translate} = require('@google-cloud/translate'); 
    return new Translate({projectId});
};