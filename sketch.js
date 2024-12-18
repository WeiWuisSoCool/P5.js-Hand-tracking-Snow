let handpose;
let video;
let predictions = [];
let particles = [];

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  // 初始化 Handpose 模型
  handpose = ml5.handpose(video, modelReady);
  handpose.on("predict", results => {
    predictions = results;
  });

  noStroke();

  // 初始化粒子，满屏随机分布
  for (let i = 0; i < 5000; i++) {
    particles.push(new Particle(random(width), random(height)));
  }
}

function modelReady() {
  console.log("Handpose model ready!");
}

function draw() {
  // 背景
  background(0);

  // 显示视频
  push();
  translate(width, 0);
  scale(-1, 1); // 镜像翻转视频
  image(video, 0, 0, width, height);
  pop();

  // 更新并绘制粒子
  for (let particle of particles) {
    applyHandForce(particle); // 对粒子应用手势交互力
    particle.update();
    particle.show();
  }
}

// 对粒子施加手势交互力
function applyHandForce(particle) {
  for (let i = 0; i < predictions.length; i++) {
    const prediction = predictions[i];
    const landmarks = prediction.landmarks;

    // 遍历每个手指的关键点
    for (let j = 0; j < landmarks.length; j++) {
      const x = landmarks[j][0];
      const y = landmarks[j][1];

      // 修正 x 坐标为镜像翻转后的坐标
      const mirroredX = width - x; // 将原始坐标映射到镜像后的位置
      const d = dist(mirroredX, y, particle.x, particle.y); // 计算粒子与关键点的距离

      if (d < 50) {
        // 如果粒子靠近手关键点，施加推力
        let forceX = (particle.x - mirroredX) / d; // 距离越近，推力越大
        let forceY = (particle.y - y) / d;
        particle.vx += forceX * 2; // 放大推力
        particle.vy += forceY * 2;

        // 重置计时器
        particle.timer = 0;
      }
    }
  }
}

// 粒子类
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-1, 1); // 随机水平速度
    this.vy = random(-1, 1); // 随机垂直速度
    this.alpha = 255; // 透明度
    this.size = random(3, 8); // 粒子大小
    this.initialVx = this.vx; // 保存初始速度
    this.initialVy = this.vy;
    this.timer = 120; // 计时器，默认 2 秒（60 帧 * 2）
  }

  // 更新粒子属性
  update() {
    this.x += this.vx;
    this.y += this.vy;

    // 边界检测
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;

    // 计时器递增
    if (this.timer < 120) {
      this.timer++;
    } else {
      // 粒子恢复到初始速度
      this.vx += (this.initialVx - this.vx) * 0.05;
      this.vy += (this.initialVy - this.vy) * 0.05;
    }

    // 摩擦力，模拟自然漂浮效果
    this.vx *= 0.98;
    this.vy *= 0.98;
  }

  // 显示粒子
  show() {
    fill(255, this.alpha);
    ellipse(this.x, this.y, this.size);
  }
}
