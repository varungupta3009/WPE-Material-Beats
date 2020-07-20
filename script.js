window.myRequestAnimationFrame = (() =>
	window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	function (callback) {
		window.setTimeout(callback, 1000 / 60);
	})();

const audioFrequencyArray = new Array(32);

window.wallpaperRegisterAudioListener &&
	window.wallpaperRegisterAudioListener((frequencyArray) => {
		for (let i = 0; i < 32; i++)
			audioFrequencyArray[i] = Math.floor(frequencyArray[i * 4] * 100);
	});

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const myObject = {
	population: 0,
	pointFrequencyIndex: 0,
	pointSize: 15,
	showPoints: true,
	moveOnBeats: true,
	pointDensity: 1,
	pulseSmoothness: 0.5,
	pointsArray: [],
	initializePoints: () => {
		myObject.pointsArray = [];
		myObject.population = Math.floor(
			(Math.floor((canvas.width * canvas.height) / 5000) *
				myObject.pointDensity) /
				4
		);
		for (let i = 0; i < myObject.population; i++)
			myObject.pointsArray.push(new Point());
	},
};

window.wallpaperPropertyListener = {
	applyUserProperties: function (properties) {
		if (properties.point_density) {
			myObject.pointDensity = properties.point_density.value;
			myObject.initializePoints();
		}

		if (properties.background_color)
			canvas.style.backgroundColor =
				'rgb(' +
				properties.background_color.value
					.split(' ')
					.map((c) => Math.ceil(c * 255)) +
				')';

		if (properties.background_image)
			if (properties.background_image.value) {
				canvas.style.backgroundImage =
					'url(file:///' + properties.background_image.value + ')';
				canvas.style.backgroundSize = '100% 100%';
			} else canvas.style.backgroundImage = 'none';

		if (properties.point_size) myObject.pointSize = properties.point_size.value / 1.5;

		if (properties.beat_smoothness)
			myObject.pulseSmoothness = 1 - properties.beat_smoothness.value / 10;

		if (properties.show_points)
			myObject.showPoints = properties.show_points.value;

		if (properties.move_on_beats)
			myObject.moveOnBeats = properties.move_on_beats.value;
	},
};

function Point() {
	this.type = Math.random() < 0.5;
	this.rotation = Math.random() < 0.5;
	this.index = myObject.pointFrequencyIndex++;
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
	myObject.pointFrequencyIndex %= 32;
}

Point.prototype.drawSelf = function () {
	// Move Point
	const momentum = myObject.moveOnBeats
		? Math.min(
				Math.max(
					audioFrequencyArray.slice(1, 6).reduce((a, b) => a + b, 0) *
						0.12,
					0.5
				),
				5
		  )
		: 1.5;
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

	// Draw Point
	let frequency = audioFrequencyArray[this.index] / 20;
	if (!frequency || frequency < 1) frequency = 1;
	let radius = Math.min(this.radius * frequency, 4) * myObject.pointSize;
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
		if (myObject.showPoints) myObject.pointsArray[i].drawSelf();
	window.myRequestAnimationFrame(window.onload);
};

window.onresize = () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	myObject.population = Math.floor((canvas.width * canvas.height) / 5000);
	myObject.initializePoints();
};

window.onresize();
