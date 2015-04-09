
var styleHelpers = {
    applyElementStyle: function (element, styleObj) {
        Object.keys(styleObj).forEach(function (key) {
            if (element.style[key] != styleObj[key]) {
                element.style[key] = styleObj[key];
            }
        })
    }
};

module.exports = styleHelpers;
