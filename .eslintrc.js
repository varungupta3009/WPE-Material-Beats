{
	"extends": "standard",
	"rules": {
		"semi": ["error", "always"],
		"camelcase": "off",
		"comma-dangle": "off",
		"no-tabs": ["error", { "allowIndentationTabs": true }],
		"indent": ["error", "tab"],
		"prefer-const": [
			"error",
			{
				"destructuring": "any",
				"ignoreReadBeforeAssign": false
			}
		]
	}
}