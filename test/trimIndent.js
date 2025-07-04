module.exports = function trimIndent(s)
{
    const m = /^\n +/.exec(s)

    if (!m)
    {
        return s
    }
    return s.substring(1).replace(new RegExp("^" + m[0].substring(1), "mg"), "")
}

