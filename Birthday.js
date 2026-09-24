const c = document.getElementById("c");

if (!c) {
  throw new Error("Canvas element #c was not found.");
}

var w = (c.width = window.innerWidth),
  h = (c.height = window.innerHeight),
  ctx = c.getContext("2d"),
  hw = w / 2, // half-width
  hh = h / 2,
  opts = {
    strings: ["HAPPY","17th","BIRTHDAY!", "SWEETHEART"],
    charSize: 30,
    charSpacing: 35,
    lineHeight: 40,

    cx: w / 2,
    cy: h / 2,

    fireworkPrevPoints: 10,
    fireworkBaseLineWidth: 5,
    fireworkAddedLineWidth: 8,
    fireworkSpawnTime: 200,
    fireworkBaseReachTime: 30,
    fireworkAddedReachTime: 30,
    fireworkCircleBaseSize: 20,
    fireworkCircleAddedSize: 10,
    fireworkCircleBaseTime: 30,
    fireworkCircleAddedTime: 30,
    fireworkCircleFadeBaseTime: 10,
    fireworkCircleFadeAddedTime: 5,
    fireworkBaseShards: 5,
    fireworkAddedShards: 5,
    fireworkShardPrevPoints: 3,
    fireworkShardBaseVel: 4,
    fireworkShardAddedVel: 2,
    fireworkShardBaseSize: 3,
    fireworkShardAddedSize: 3,
    gravity: 0.1,
    upFlow: -0.1,
    letterContemplatingWaitTime: 360,
    balloonSpawnTime: 20,
    balloonBaseInflateTime: 10,
    balloonAddedInflateTime: 10,
    balloonBaseSize: 20,
    balloonAddedSize: 20,
    balloonBaseVel: 0.4,
    balloonAddedVel: 0.4,
    balloonBaseRadian: -(Math.PI / 2 - 0.5),
    balloonAddedRadian: -1,
  },
  calc = {
    totalWidth:
      opts.charSpacing *
      Math.max(opts.strings[0].length, opts.strings[1].length),
  },
  Tau = Math.PI * 2,
  TauQuarter = Tau / 4,
  letters = [];

// ── Romantic palette: deep rose, ruby, blush, gold, magenta, coral ──
var romanticColors = [
  { h: 345, s: 90, l: 62 },  // rose pink
  { h: 355, s: 88, l: 55 },  // ruby red
  { h: 330, s: 82, l: 68 },  // soft blush
  { h:  38, s: 95, l: 58 },  // warm gold
  { h: 318, s: 85, l: 62 },  // magenta
  { h:  10, s: 90, l: 65 },  // coral
  { h:   0, s: 80, l: 50 },  // deep crimson
];

var globalTick = 0; // used for floating animation time

ctx.font = opts.charSize + "px Verdana";

function Letter(char, x, y, colorIndex) {
  this.char = char;
  this.x = x;
  this.y = y;
  this.colorIndex = colorIndex;

  this.dx = -ctx.measureText(char).width / 2;
  this.dy = +opts.charSize / 2;

  this.fireworkDy = this.y - hh;

  var col = romanticColors[colorIndex % romanticColors.length];
  var h = col.h, s = col.s, l = col.l;

  this.color         = "hsl("  + h + "," + s + "%," + l       + "%)";
  this.lightColor    = "hsl("  + h + "," + s + "%,light%)";
  this.alphaColor    = "hsla(" + h + "," + s + "%," + l       + "%,alp)";
  this.lightAlphaColor = "hsla(" + h + "," + s + "%,light%,alp)";

  this.reset();
}
Letter.prototype.reset = function () {
  this.phase = "firework";
  this.tick = 0;
  this.spawned = false;
  this.spawningTime = (opts.fireworkSpawnTime * Math.random()) | 0;
  this.reachTime =
    (opts.fireworkBaseReachTime + opts.fireworkAddedReachTime * Math.random()) |
    0;
  this.lineWidth =
    opts.fireworkBaseLineWidth + opts.fireworkAddedLineWidth * Math.random();
  this.prevPoints = [[0, hh, 0]];
};
Letter.prototype.step = function () {
  if (this.phase === "firework") {
    if (!this.spawned) {
      ++this.tick;
      if (this.tick >= this.spawningTime) {
        this.tick = 0;
        this.spawned = true;
      }
    } else {
      ++this.tick;

      var linearProportion = this.tick / this.reachTime,
        armonicProportion = Math.sin(linearProportion * TauQuarter),
        x = linearProportion * this.x,
        y = hh + armonicProportion * this.fireworkDy;

      if (this.prevPoints.length > opts.fireworkPrevPoints)
        this.prevPoints.shift();

      this.prevPoints.push([x, y, linearProportion * this.lineWidth]);

      var lineWidthProportion = 1 / (this.prevPoints.length - 1);

      for (var i = 1; i < this.prevPoints.length; ++i) {
        var point = this.prevPoints[i],
          point2 = this.prevPoints[i - 1];

        ctx.strokeStyle = this.alphaColor.replace(
          "alp",
          i / this.prevPoints.length,
        );
        ctx.lineWidth = point[2] * lineWidthProportion * i;
        ctx.beginPath();
        ctx.moveTo(point[0], point[1]);
        ctx.lineTo(point2[0], point2[1]);
        ctx.stroke();
      }

      if (this.tick >= this.reachTime) {
        this.phase = "contemplate";

        this.circleFinalSize =
          opts.fireworkCircleBaseSize +
          opts.fireworkCircleAddedSize * Math.random();
        this.circleCompleteTime =
          (opts.fireworkCircleBaseTime +
            opts.fireworkCircleAddedTime * Math.random()) |
          0;
        this.circleCreating = true;
        this.circleFading = false;

        this.circleFadeTime =
          (opts.fireworkCircleFadeBaseTime +
            opts.fireworkCircleFadeAddedTime * Math.random()) |
          0;
        this.tick = 0;
        this.tick2 = 0;

        this.shards = [];

        var shardCount =
            (opts.fireworkBaseShards +
              opts.fireworkAddedShards * Math.random()) |
            0,
          angle = Tau / shardCount,
          cos = Math.cos(angle),
          sin = Math.sin(angle),
          x = 1,
          y = 0;

        for (var i = 0; i < shardCount; ++i) {
          var x1 = x;
          x = x * cos - y * sin;
          y = y * cos + x1 * sin;

          this.shards.push(new Shard(this.x, this.y, x, y, this.alphaColor));
        }
      }
    }
  } else if (this.phase === "contemplate") {
    ++this.tick;

    if (this.circleCreating) {
      ++this.tick2;
      var proportion = this.tick2 / this.circleCompleteTime,
        armonic = -Math.cos(proportion * Math.PI) / 2 + 0.5;

      ctx.beginPath();
      ctx.fillStyle = this.lightAlphaColor
        .replace("light", 50 + 50 * proportion)
        .replace("alp", proportion);
      ctx.beginPath();
      ctx.arc(this.x, this.y, armonic * this.circleFinalSize, 0, Tau);
      ctx.fill();

      if (this.tick2 > this.circleCompleteTime) {
        this.tick2 = 0;
        this.circleCreating = false;
        this.circleFading = true;
      }
    } else if (this.circleFading) {
      ctx.fillStyle = this.lightColor.replace("light", 80);
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);
      ctx.shadowBlur = 0;

      ++this.tick2;
      var proportion = this.tick2 / this.circleFadeTime,
        armonic = -Math.cos(proportion * Math.PI) / 2 + 0.5;

      ctx.beginPath();
      ctx.fillStyle = this.lightAlphaColor
        .replace("light", 100)
        .replace("alp", 1 - armonic);
      ctx.arc(this.x, this.y, this.circleFinalSize, 0, Tau);
      ctx.fill();

      if (this.tick2 >= this.circleFadeTime) this.circleFading = false;
    } else {
      // glowing letter with soft pulsing glow
      var pulse = 1 + Math.sin(globalTick * 0.05) * 0.05;
      ctx.font = (opts.charSize * pulse) + "px Verdana";
      ctx.fillStyle = this.lightColor.replace("light", 82);
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 18;
      ctx.fillText(this.char, this.x + this.dx, this.y + this.dy + (opts.charSize * (pulse - 1)) / 2);
      ctx.shadowBlur = 0;
      ctx.font = opts.charSize + "px Verdana";
    }

    for (var i = 0; i < this.shards.length; ++i) {
      this.shards[i].step();

      if (!this.shards[i].alive) {
        this.shards.splice(i, 1);
        --i;
      }
    }

    if (this.tick > opts.letterContemplatingWaitTime) {
      this.phase = "balloon";

      this.tick = 0;
      this.spawning = true;
      this.spawnTime = (opts.balloonSpawnTime * Math.random()) | 0;
      this.inflating = false;
      this.inflateTime =
        (opts.balloonBaseInflateTime +
          opts.balloonAddedInflateTime * Math.random()) |
        0;
      this.size =
        (opts.balloonBaseSize + opts.balloonAddedSize * Math.random()) | 0;

      var rad =
          opts.balloonBaseRadian + opts.balloonAddedRadian * Math.random(),
        vel = opts.balloonBaseVel + opts.balloonAddedVel * Math.random();

      this.vx = Math.cos(rad) * vel;
      this.vy = Math.sin(rad) * vel;
    }
  } else if (this.phase === "balloon") {
    ctx.strokeStyle = this.lightColor.replace("light", 80);

    if (this.spawning) {
      ++this.tick;
      ctx.fillStyle = this.lightColor.replace("light", 82);
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);
      ctx.shadowBlur = 0;

      if (this.tick >= this.spawnTime) {
        this.tick = 0;
        this.spawning = false;
        this.inflating = true;
      }
    } else if (this.inflating) {
      ++this.tick;

      var proportion = this.tick / this.inflateTime,
        x = (this.cx = this.x),
        y = (this.cy = this.y - this.size * proportion);

      ctx.fillStyle = this.alphaColor.replace("alp", proportion);
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 14 * proportion;
      ctx.beginPath();
      generateBalloonPath(x, y, this.size * proportion);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, this.y);
      ctx.stroke();

      ctx.fillStyle = this.lightColor.replace("light", 82);
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);
      ctx.shadowBlur = 0;

      if (this.tick >= this.inflateTime) {
        this.tick = 0;
        this.inflating = false;
      }
    } else {
      this.cx += this.vx;
      this.cy += this.vy += opts.upFlow;

      // glow on balloon
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12 + Math.sin(globalTick * 0.06) * 4;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      generateBalloonPath(this.cx, this.cy, this.size);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.moveTo(this.cx, this.cy);
      ctx.lineTo(this.cx, this.cy + this.size);
      ctx.stroke();

      ctx.fillStyle = this.lightColor.replace("light", 88);
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
      ctx.fillText(this.char, this.cx + this.dx, this.cy + this.dy + this.size);
      ctx.shadowBlur = 0;

      if (this.cy + this.size < -hh || this.cx < -hw || this.cy > hw)
        this.phase = "done";
    }
  }
};

function Shard(x, y, vx, vy, color) {
  var vel =
    opts.fireworkShardBaseVel + opts.fireworkShardAddedVel * Math.random();

  this.vx = vx * vel;
  this.vy = vy * vel;

  this.x = x;
  this.y = y;

  this.prevPoints = [[x, y]];
  this.color = color;

  this.alive = true;

  this.size =
    opts.fireworkShardBaseSize + opts.fireworkShardAddedSize * Math.random();
}
Shard.prototype.step = function () {
  this.x += this.vx;
  this.y += this.vy += opts.gravity;

  if (this.prevPoints.length > opts.fireworkShardPrevPoints)
    this.prevPoints.shift();

  this.prevPoints.push([this.x, this.y]);

  var lineWidthProportion = this.size / this.prevPoints.length;

  for (var k = 0; k < this.prevPoints.length - 1; ++k) {
    var point = this.prevPoints[k],
      point2 = this.prevPoints[k + 1];

    ctx.strokeStyle = this.color.replace("alp", k / this.prevPoints.length);
    ctx.lineWidth = k * lineWidthProportion;
    ctx.beginPath();
    ctx.moveTo(point[0], point[1]);
    ctx.lineTo(point2[0], point2[1]);
    ctx.stroke();
  }

  if (this.prevPoints[0][1] > hh) this.alive = false;
};
function generateBalloonPath(x, y, size) {
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(
    x - size / 2,
    y - size / 2,
    x - size / 4,
    y - size,
    x,
    y - size,
  );
  ctx.bezierCurveTo(x + size / 4, y - size, x + size / 2, y - size / 2, x, y);
}

function anim() {
  window.requestAnimationFrame(anim);
  globalTick++;

  // ── Pure black background ──
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  ctx.translate(hw, hh);

  var done = true;
  for (var l = 0; l < letters.length; ++l) {
    letters[l].step();
    if (letters[l].phase !== "done") done = false;
  }

  ctx.translate(-hw, -hh);

  if (done) for (var l = 0; l < letters.length; ++l) letters[l].reset();
}

var colorIdx = 0;
for (var i = 0; i < opts.strings.length; ++i) {
  for (var j = 0; j < opts.strings[i].length; ++j) {
    letters.push(
      new Letter(
        opts.strings[i][j],
        j * opts.charSpacing +
          opts.charSpacing / 2 -
          (opts.strings[i].length * opts.charSize) / 2,
        i * opts.lineHeight +
          opts.lineHeight / 2 -
          (opts.strings.length * opts.lineHeight) / 2,
        colorIdx++,
      ),
    );
  }
}

anim();

window.addEventListener("resize", function () {
  w = c.width = window.innerWidth;
  h = c.height = window.innerHeight;

  hw = w / 2;
  hh = h / 2;

  ctx.font = opts.charSize + "px Verdana";
});

// ── Interactive Floating Letter ──────────────────────────────────────────────
(function () {
  var el       = document.getElementById("fl-letter");
  var overlay  = document.getElementById("fl-overlay");
  var closeBtn = document.getElementById("fl-close");

  if (!el || !overlay || !closeBtn) return;

  var clickCount = 0;

  // Random position keeping the element fully inside the viewport
  function randomPos() {
    var margin = 80;
    var x = margin + Math.random() * (window.innerWidth  - margin * 2);
    var y = margin + Math.random() * (window.innerHeight - margin * 2);
    return { x: x, y: y };
  }

  // Smoothly move the floating letter to (x, y)
  function moveTo(x, y) {
    el.style.left = x + "px";
    el.style.top  = y + "px";
  }

  // Start at a random position
  var start = randomPos();
  moveTo(start.x, start.y);

  el.addEventListener("click", function (e) {
    e.stopPropagation();
    if (!window.music) {
    window.music = new Audio("music.m4a");
    window.music.loop = true;
    window.music.volume = 1;
}

window.music.play().catch(() => {});
    clickCount++;

    if (clickCount === 1) {
      // First click: jump to a new random spot
      el.classList.add("fl-jump");
      setTimeout(function () { el.classList.remove("fl-jump"); }, 400);
      var p = randomPos();
      moveTo(p.x, p.y);

    } else if (clickCount === 2) {
      // Second click: jump to another random spot
      el.classList.add("fl-jump");
      setTimeout(function () { el.classList.remove("fl-jump"); }, 400);
      var p = randomPos();
      moveTo(p.x, p.y);

    } else {
      // Third click: open romantic message
      clickCount = 0;
      overlay.classList.add("fl-open");
    }
  });

  closeBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    overlay.classList.remove("fl-open");
  });

  // Also close overlay on overlay background click
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) {
      overlay.classList.remove("fl-open");
    }
  });
})();
