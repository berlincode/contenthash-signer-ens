module.exports = {
    "globals": {
        "define": true
    },
    "env": {
        "browser": true,
        "commonjs": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-warning-comments": [
            1,
            {
                "terms": ["todo", "fixme"],
                "location": "anywhere"
            }
        ],
        "object-curly-spacing": [
            "error",
            "never"
        ],
        "ie11/no-collection-args": [ "error" ],
        "ie11/no-for-in-const": [ "error" ],
        "ie11/no-loop-func": [ "warn" ],
        "ie11/no-weak-collections": [ "error" ]
    },
    "plugins": [
        "html",
        "ie11"
    ]
};
