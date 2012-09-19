var Enums = {
	Orientations: {
		UP: 38,
		DOWN: 40,
		LEFT: 37,
		RIGHT: 39
	},

	MessagesTypes: {
		KEYUP: "keyUp",
		KEYDOWN: "keyDown",
		KEYPRESS: "keyPress"
	}
};

// Expose the class to Node.js
module.exports = Enums;