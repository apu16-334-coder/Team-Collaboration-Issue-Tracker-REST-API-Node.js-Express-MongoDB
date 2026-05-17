const filterBody = (body, ...allowedFields) =>{
    let filtered = {};

    allowedFields.forEach(field => {
        if(body.hasOwnProperty(field)) {
            filtered[field] = body[field]
        }
    })
    return filtered;
}

module.exports = filterBody;