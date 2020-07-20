const myObject = {
	// peakValue: 1,
	population: 0,
	shapeFrequencyIndex: 0,
	shapeSize: 15,
	showShapes: true,
	moveOnBass: true,
	pulseOnBeats: true,
	shapeDensity: 1,
	pulseSmoothness: 0.5,
	shapesArray: [],
	initializeShapes: () => {
		myObject.shapesArray = [];
		myObject.population = Math.floor(
			(Math.floor((canvas.width * canvas.height) / 5000) *
				myObject.shapeDensity) /
				4
		);
		for (let i = 0; i < myObject.population; i++)
			myObject.shapesArray.push(new Shape());
	},
};

window.myRequestAnimationFrame = (() =>
	window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	function (callback) {
		window.setTimeout(callback, 1000 / 60);
	})();

const lAudioFrequencyArray = new Array(32);
const rAudioFrequencyArray = new Array(32);

window.wallpaperRegisterAudioListener &&
	window.wallpaperRegisterAudioListener((frequencyArray) => {
		// myObject.peakValue = myObject.peakValue * 0.99 + Math.max(frequencyArray);
		for (let i = 0; i < 32; i++) {
			lAudioFrequencyArray[i] = Math.floor(
				(frequencyArray[i] + frequencyArray[i + 32]) * 50 // / myObject.peakValue
			);
			rAudioFrequencyArray[i] = Math.floor(
				(frequencyArray[i + 64] + frequencyArray[i + 96]) * 50 // / myObject.peakValue
			);
		}
	});

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.wallpaperPropertyListener = {
	applyUserProperties: function (properties) {
		if (properties['background_color'])
			canvas.style.backgroundColor =
				'rgb(' +
				properties['background_color'].value
					.split(' ')
					.map((c) => Math.ceil(c * 255)) +
				')';

		if (properties['background_image'])
			if (properties['background_image'].value) {
				canvas.style.backgroundImage =
					'url(file:///' + properties['background_image'].value + ')';
				canvas.style.backgroundSize = '100% 100%';
			} else canvas.style.backgroundImage = 'none';

		if (properties['show_shapes']) {
			myObject.showShapes = properties['show_shapes'].value;

			if (properties['shape_density']) {
				myObject.shapeDensity = properties['shape_density'].value;
				myObject.initializeShapes();
			}

			if (properties['shape_size'])
				myObject.shapeSize = properties['shape_size'].value / 1.5;

			if (properties['pulse_on_beats'])
				myObject.pulseOnBeats = properties['pulse_on_beats'].value;

			if (properties['pulse_smoothness'])
				myObject.pulseSmoothness =
					1 - properties['pulse_smoothness'].value / 10;

			if (properties['move_on_bass'])
				myObject.moveOnBass = properties['move_on_bass'].value;
		}
	},
};

function Shape() {
	this.type = Math.random() < 0.5;
	this.rotation = Math.random() < 0.5;
	this.index = myObject.shapeFrequencyIndex++;
	this.x = Math.random() * canvas.width;
	this.y = Math.random() * canvas.height;
	this.speedX = -0.5 + Math.random();
	this.speedY = -0.5 + Math.random();
	this.radius = (Math.floor(Math.random() * 90) * 0.01 + 0.1) * 2.5 + 0.5;
	this.intermediateRadius = 0;
	this.color = ((_) =>
		['#4285F4', '#EA4335', '#FBBC05', '#34A853'][this.index % 4])();
	this.angle1 = this.type
		? 2 * Math.PI
		: (Math.round(Math.random() * 100) / 200) * Math.PI;
	this.angle2 = this.type
		? 0
		: (Math.round(Math.random() * 100) / 200 + 1) * Math.PI;
	myObject.shapeFrequencyIndex %= 32;
}

Shape.prototype.drawSelf = function () {
	const audioFrequencyArray =
		this.x < canvas.width / 2 ? lAudioFrequencyArray : rAudioFrequencyArray;
	// Move Shape
	const momentum = myObject.moveOnBass
		? Math.min(
				Math.max(
					audioFrequencyArray
						// lAudioFrequencyArray.map((num, idx) => num + rAudioFrequencyArray[idx])
						.slice(1, 6)
						.reduce((a, b) => a + b, 0) * 0.12,
					0.5
				),
				5
		  )
		: 0.5;
	const newRadius = this.intermediateRadius + (this.type ? 0 : 5);
	this.x += this.speedX * momentum;
	this.y += this.speedY * momentum;
	if (this.x >= canvas.width - newRadius) {
		this.x = canvas.width - newRadius;
		this.speedX = -this.speedX;
	} else if (this.x <= newRadius) {
		this.x = newRadius;
		this.speedX = -this.speedX;
	}
	if (this.y >= canvas.height - newRadius) {
		this.y = canvas.height - newRadius;
		this.speedY = -this.speedY;
	} else if (this.y <= newRadius) {
		this.y = newRadius;
		this.speedY = -this.speedY;
	}
	if (!this.type) {
		this.angle1 += (this.rotation ? 0.01 : -0.01) * momentum;
		this.angle2 += (this.rotation ? 0.01 : -0.01) * momentum;
	}

	// Draw Shape
	let frequency = audioFrequencyArray[this.index] / 20;
	if (!frequency || frequency < 1 || !myObject.pulseOnBeats) frequency = 1;
	let radius = Math.min(this.radius * frequency, 4) * myObject.shapeSize;
	if (this.intermediateRadius && myObject.pulseSmoothness !== 1)
		radius =
			radius * myObject.pulseSmoothness +
			this.intermediateRadius * (1 - myObject.pulseSmoothness);
	context.lineWidth = 10;
	context.beginPath();
	this.type
		? (context.fillStyle = this.color)
		: (context.strokeStyle = this.color);
	context.arc(this.x, this.y, radius, this.angle1, this.angle2, false);
	this.type ? context.fill() : context.stroke();
	if (myObject.pulseSmoothness !== 1) this.intermediateRadius = radius;
};

window.onload = () => {
	context.clearRect(0, 0, canvas.width, canvas.height);
	for (let i = 0; i < myObject.population; i++)
		if (myObject.showShapes) myObject.shapesArray[i].drawSelf();
	window.myRequestAnimationFrame(window.onload);
};

window.onresize = () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	myObject.population = Math.floor((canvas.width * canvas.height) / 5000);
	myObject.initializeShapes();
};

window.onresize();
