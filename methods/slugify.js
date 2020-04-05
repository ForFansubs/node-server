const generalSlugify = text => {
    const a = "àáäâèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ♭°·/_,:;'"
    const b = "aaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzhf0------'"
    const p = new RegExp(a.split('').join('|'), 'g')

    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(p, c =>
            b.charAt(a.indexOf(c)))     // Replace special chars
        .replace(/&/g, '-and-')         // Replace & with 'and'
        .replace(/[^\w\-]+/g, '-')      // Remove all non-word chars */
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '')             // Trim - from end of text
}

const permissionSlugify = text => {
    const a = 'àáäâèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ♭·/_,:;'
    const b = 'aaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzhf------'
    const p = new RegExp(a.split('').join('|'), 'g')

    return text.toString().toLowerCase()
        .replace(/\s+/g, '')           // Replace spaces with -
        .replace(p, c =>
            b.charAt(a.indexOf(c)))     // Replace special chars
        .replace(/&/g, '')         // Replace & with 'and'
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '')             // Trim - from end of text
}

const generalStringify = text => {
    return text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
}

module.exports = { generalSlugify, generalStringify, permissionSlugify }