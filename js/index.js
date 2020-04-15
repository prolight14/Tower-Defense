function main()
{

size(600, 600);


//Attention, if you know anybody who can tweak this up into a real game tell me because I'm really struggling with the game design.

// TODO: Put gold and then platinum colored turrets next on the turrets list.

var gridInfo = {
    unitWidth: 60,
    unitHeight: 60,
    halfUnitWidth: 30,
    halfUnitHeight: 30,
    plan: [[]]
};

var fonts = {
    "arial black": createFont("arial black")
};

var stats = {
    coins: 300,
    level: 0
};

var scenes = {
    scene: "intro"
};

var images = {
    block: getImage("cute/StoneBlock"),
    grass: getImage("cute/GrassBlock"),
    water: getImage("cute/WaterBlock"),
    enemies: {
        greenSeed: getImage("avatars/leafers-seed"),
        blueSeed: getImage("avatars/aqualine-seed"),
        redSeed: getImage("avatars/piceratops-seed"),
        purpleSeed: getImage("avatars/duskpin-seed"),
        greenSeedling: getImage("avatars/leafers-seedling"),
        blueSeedling: getImage("avatars/aqualine-seedling"),
        redSeedling: getImage("avatars/piceratops-seedling"),
        purpleSeedling: getImage("avatars/duskpin-seedling"),
    }
};

var keys = [];
var keyPressed = function()
{
    keys[keyCode] = true;
    keys[key.toString()] = true;
};
var keyReleased = function()
{
    delete keys[keyCode];
    delete keys[key.toString()];
};

var pixelFuncs = {
    safeRead : function(item, col, row)
    {
        return (((col >= 0 && col < item.length) &&
               (row >= 0 && row < item[col].length)) ? item[col][row] : undefined);
    },
    createPixelImage : function(input)
    {
        var img = createGraphics(
            input.width || input.pixels[0].length * input.pixelSize,
            input.height || input.pixels.length * input.pixelSize,
            P2D);
        img.beginDraw();
        img.noStroke();
        img.background(0, 0, 0, 0);
        
        var shadowW = input.pixelSize * 0.3;
        var shadowH = input.pixelSize * 0.0;
        
        for(var row = 0; row < input.pixels.length; row++)
        {
            for(var col = 0; col < input.pixels[row].length; col++)
            {
                var char = pixelFuncs.safeRead(input.pixels, row, col);
                var toFill = (input.pallete[char] !== undefined) ? 
                              input.pallete[char] : "clear";
                              
                if(toFill !== "clear")
                {
                    var x = col * input.pixelSize;
                    var y = row * input.pixelSize;
                    
                    if(col > 0 && input.shadow)
                    {
                        var charB = pixelFuncs.safeRead(input.pixels, row, col - 1);
                        if(charB === ' ')
                        {
                            img.fill(0, 0, 0, 100);
                            img.rect(x - input.pixelSize * 0.5, 
                            y, input.pixelSize * 1.0, input.pixelSize * 1.0);
                        }
                    }
                    
                    img.fill(toFill);
                    img.rect(x, y, input.pixelSize, input.pixelSize);
                }
            }
        }
        img.endDraw();
        return img;
    },
};

var pixelImages = {
    falcon: pixelFuncs.createPixelImage({
        pixelSize : 10, 
        pixels : [
           "     BBBBBB     ",
           "    B      B    ",
           "   B        B   ",
           "  B  B    B  B  ",
           " B    B  B    B ",
           " BB          BB ",
           " BBBBBBBBBBBBBB ",
           "  BBBBBBBBBBBB  ",
        ],
        pallete : {
            'B': color(0, 0, 0)
        },
    }),
};

var createArray = function(object, array)
{
    array = array || [];
    array.references = {};

    array.add = function()
    {
        var oNew = Object.create(object.prototype);
        object.apply(oNew, arguments);
        this.push(oNew);

        return oNew;
    };
    array.addObject = function(name)
    {
        if(this.references[name] === undefined)
        {
            this.references[name] = this.length;

            this.push(arguments[1]);
            return arguments[1];
        }
    };
    array.getObject = function(name)
    {
        if(this[this.references[name]] === undefined)
        {
            delete this.references[name];
        }

        return this[this.references[name]];
    };

    return array;
};

var Bar = function(x, y, width, height)
{
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.color = color(255, 255, 255, 100);
    this.stroke = color(255, 255, 255);
    this.barColor = color(0, 0, 200);

    this.amt = 50;
    this.max = 100;
};
Bar.prototype.draw = function()
{
    noStroke();
    fill(this.barColor);
    rect(this.x, this.y, Math.max(this.amt * this.width / this.max, 0), this.height);

    fill(this.color);

    if(this.stroke === undefined)
    {
        noStroke();
    }else{
        stroke(this.stroke);
    }
    rect(this.x, this.y, this.width, this.height);
};

var gameObjects = createArray([]);

var Enemy = function(x, y, diameter)
{
    this.x = x;
    this.y = y;
    this.diameter = diameter;
    this.radius = diameter / 2;

    this.index = 0;
    this.speed = 1;
    this.hp = 10;
    this.maxHp = 10;
    this.damage = 5; //1;
    this.value = 0;

    this.hpBar = new Bar(this.x - this.radius, this.y - this.radius - 8, this.diameter, 4);
    delete this.hpBar.stroke;
    this.hpBar.barColor = color(0, 223, 30);
};
Enemy.prototype.update = function(lines)
{
    if(this.index >= lines.length)
    {
        this.gone = true;
        return;
    }

    var segment = lines[this.index];

    var dx = segment[2] - this.x;
    var dy = segment[3] - this.y;

    var theta = atan2(dy, dx);

    this.x += cos(theta) * this.speed;
    this.y += sin(theta) * this.speed;

    if(dx * dx + dy * dy < 3)
    {
        this.x = segment[2];
        this.y = segment[3];

        this.index++;
    }

    if(this.hp <= 0)
    {
        stats.coins += this.value;
        this.dead = true;
    }
};
Enemy.prototype.draw = function() {};
Enemy.prototype.drawHpBar = function()
{
    this.hpBar.x = this.x - this.radius;
    this.hpBar.y = this.y - this.radius - 8;
    this.hpBar.draw();

    if(this.hpBar.amt * 100 / this.hpBar.max < 25)
    {
        this.hpBar.barColor = color(200, 23, 7);
    }

    this.hpBar.amt = this.hp;
    this.hpBar.max = this.maxHp;
};

var Level1Enemy = function(x, y, diameter)
{
    Enemy.call(this, x, y, diameter);

    this.value = 25;
    this.hp = 5;
    this.maxHp = 5;
};
Level1Enemy.prototype = Object.create(Enemy.prototype);
Level1Enemy.prototype.draw = function()
{
    this.drawHpBar();

    image(images.enemies.redSeed, this.x - this.diameter, this.y - this.diameter, this.diameter * 2, this.diameter * 2);
};

gameObjects.addObject("level1Enemy", createArray(Level1Enemy));
gameObjects.getObject("level1Enemy").isEnemy = true;

var Level2Enemy = function(x, y, diameter)
{
    Enemy.call(this, x, y, diameter);

    this.value = 50;
    this.hp = 7;
    this.maxHp = 7;
    this.damage = 10;
};
Level2Enemy.prototype = Object.create(Enemy.prototype);
Level2Enemy.prototype.draw = function()
{
    this.drawHpBar();

    image(images.enemies.blueSeed, this.x - this.diameter, this.y - this.diameter, this.diameter * 2, this.diameter * 2);
};

gameObjects.addObject("level2Enemy", createArray(Level2Enemy));
gameObjects.getObject("level2Enemy").isEnemy = true;

var Level3Enemy = function(x, y, diameter)
{
    Enemy.call(this, x, y, diameter);

    this.value = 50;
    this.hp = 10;
    this.maxHp = 10;
    this.damage = 15;
};
Level3Enemy.prototype = Object.create(Enemy.prototype);
Level3Enemy.prototype.draw = function()
{
    this.drawHpBar();

    image(images.enemies.greenSeed, this.x - this.diameter, this.y - this.diameter, this.diameter * 2, this.diameter * 2);
};

gameObjects.addObject("level3Enemy", createArray(Level3Enemy));
gameObjects.getObject("level3Enemy").isEnemy = true;

var Level4Enemy = function(x, y, diameter)
{
    Enemy.call(this, x, y, diameter);

    this.value = 75;
    this.hp = 15;
    this.maxHp = 15;
    this.damage = 20;
};
Level4Enemy.prototype = Object.create(Enemy.prototype);
Level4Enemy.prototype.draw = function()
{
    this.drawHpBar();

    image(images.enemies.purpleSeed, this.x - this.diameter, this.y - this.diameter, this.diameter * 2, this.diameter * 2);
};

gameObjects.addObject("level4Enemy", createArray(Level4Enemy));
gameObjects.getObject("level4Enemy").isEnemy = true;

var Level5Enemy = function(x, y, diameter)
{
    Enemy.call(this, x, y, diameter);

    this.value = 90;
    this.hp = 20;
    this.maxHp = 20;
    this.damage = 30;
};
Level5Enemy.prototype = Object.create(Enemy.prototype);
Level5Enemy.prototype.draw = function()
{
    pushMatrix();
        translate(0, -12);
        this.drawHpBar();
    popMatrix();


    image(images.enemies.redSeedling, this.x - this.diameter, this.y - this.diameter, this.diameter * 2, this.diameter * 2);
};
gameObjects.addObject("level5Enemy", createArray(Level5Enemy));
gameObjects.getObject("level5Enemy").isEnemy = true;

var Bullet = function(x, y, diameter)
{
    this.x = x;
    this.y = y;
    this.diameter = diameter;
    this.radius = diameter / 2;

    this.angle = 0;
    this.speed = 5;
    this.damage = 1;

    this.dist = 0;
    this.range = Infinity;
};
Bullet.prototype.update = function()
{
    this.x += cos(this.angle) * this.speed;
    this.y += sin(this.angle) * this.speed;

    this.dist += this.speed;

    if(this.dist > this.range)
    {
        this.dead = true;
    }
};
Bullet.prototype.act = function(enemies)
{
    for(var i = 0; i < enemies.length; i++)
    {
        for(var j = 0; j < enemies[i].length; j++)
        {
            if(Math.pow(this.x - enemies[i][j].x, 2) + Math.pow(this.y - enemies[i][j].y, 2) < Math.pow(enemies[i][j].radius + this.radius, 2))
            {
                enemies[i][j].hp -= this.damage;
                this.dead = true;
            }
        }
    }
};

var Level1Bullet = function(x, y, diameter)
{
    Bullet.call(this, x, y, diameter);
};
Level1Bullet.prototype = Object.create(Bullet.prototype);
Level1Bullet.prototype.draw = function()
{
    fill(0, 230, 56);
    ellipse(this.x, this.y, this.diameter, this.diameter);
};

gameObjects.addObject("level1Bullet", createArray(Level1Bullet));
gameObjects.getObject("level1Bullet").isBullet = true;

var Level2Bullet = function(x, y, diameter)
{
    Bullet.call(this, x, y, diameter);

    this.damage = 3;
};
Level2Bullet.prototype = Object.create(Bullet.prototype);
Level2Bullet.prototype.draw = function()
{
    fill(0, 0, 0, 100);
    ellipse(this.x, this.y, this.diameter, this.diameter);
};

gameObjects.addObject("level2Bullet", createArray(Level2Bullet));
gameObjects.getObject("level2Bullet").isBullet = true;

var Level3Bullet = function(x, y, diameter)
{
    Bullet.call(this, x, y, diameter);

    this.damage = 5;
    this.speed = 6;
};
Level3Bullet.prototype = Object.create(Bullet.prototype);
Level3Bullet.prototype.draw = function()
{
    fill(100, 200, 0);
    ellipse(this.x, this.y, this.diameter, this.diameter);
};

gameObjects.addObject("level3Bullet", createArray(Level3Bullet));
gameObjects.getObject("level3Bullet").isBullet = true;

var Turret = function(x, y, diameter)
{
    this.x = x;
    this.y = y;
    this.diameter = diameter;
    this.radius = diameter / 2;
    this.angle = 90;
    this.range = 100;
    this.rangeSq = 100 * 100;
    this.radiusSq = this.radius * this.radius;

    this.shootTimer = 0;
    this.lastShootTime = 0;
    this.shootInterval = 75;
};
Turret.prototype.shoot = function() {};
Turret.prototype.update = function()
{
    if(this.inRange && this.shootTimer - this.lastShootTime > this.shootInterval)
    {
        this.shoot();
        this.lastShootTime = this.shootTimer;
    }

    this.shootTimer++;
};
Turret.prototype.aim = function(enemies)
{
    var closest = this.rangeSq;
    var dist;

    this.inRange = false;

    for(var i = 0; i < enemies.length; i++)
    {
        for(var j = 0; j < enemies[i].length; j++)
        {
            var dx = this.x - enemies[i][j].x;
            var dy = this.y - enemies[i][j].y;

            if((dist = Math.pow(dx, 2) + Math.pow(dy, 2)) < closest)
            {
                closest = dist;
                this.angle = atan2(dy, dx);

                this.inRange = true;
            }
        }
    }
};
Turret.prototype.drawRange = function()
{
    if(this.placed && Math.pow(this.x - mouseX, 2) + Math.pow(this.y - mouseY, 2) < this.radiusSq)
    {
        noStroke();
        fill(255, 255, 255, 70);
        ellipse(this.x, this.y, this.range * 2, this.range * 2);
    }
};
Turret.prototype.draw = function() {};

var Level1Turret = function(x, y, diameter)
{
    Turret.call(this, x, y, diameter);
};
Level1Turret.prototype = Object.create(Turret.prototype);
Level1Turret.prototype.shoot = function()
{
    var bullet = gameObjects.getObject("level1Bullet").add(this.x, this.y, 5);

    bullet.angle = this.angle + 180;
    bullet.range = this.range;
};
Level1Turret.prototype.draw = function()
{
    noStroke();
    fill(200, 0, 0);
    pushMatrix();
        translate(this.x, this.y);
        rotate(this.angle + 90);
        rect(-5, 0, 10, this.radius * 2);
    popMatrix();

    ellipse(this.x, this.y, this.diameter, this.diameter);

    fill(0, 0, 0, 100);
    ellipse(this.x, this.y, this.diameter - 6, this.diameter - 6);
};

gameObjects.addObject("level1Turret", createArray(Level1Turret));
gameObjects.getObject("level1Turret").isTurret = true;

var Level2Turret = function(x, y, diameter)
{
    Turret.call(this, x, y, diameter);

    this.range = 100;
    this.rangeSq = 100 * 100;
    this.shootInterval = 50;
};
Level2Turret.prototype = Object.create(Turret.prototype);
Level2Turret.prototype.shoot = function()
{
    var bullet = gameObjects.getObject("level1Bullet").add(this.x, this.y, 5);

    bullet.angle = this.angle + 180;
    bullet.range = this.range;
};
Level2Turret.prototype.draw = function()
{
    noStroke();
    fill(0, 0, 200);
    pushMatrix();
        translate(this.x, this.y);
        rotate(this.angle + 90);
        rect(-5, 0, 10, this.radius * 2);
    popMatrix();

    ellipse(this.x, this.y, this.diameter, this.diameter);

    fill(0, 0, 0, 100);
    ellipse(this.x, this.y, this.diameter - 6, this.diameter - 6);
};

gameObjects.addObject("level2Turret", createArray(Level2Turret));
gameObjects.getObject("level2Turret").isTurret = true;

var Level3Turret = function(x, y, diameter)
{
    Turret.call(this, x, y, diameter);

    this.range = 200;
    this.rangeSq = 200 * 200;
    this.shootInterval = 125;
};
Level3Turret.prototype = Object.create(Turret.prototype);
Level3Turret.prototype.shoot = function()
{
    var bullet = gameObjects.getObject("level2Bullet").add(this.x, this.y, 5);

    bullet.angle = this.angle + 180;
    bullet.range = this.range;
};
Level3Turret.prototype.draw = function()
{
    noStroke();
    fill(0, 200, 0);
    pushMatrix();
        translate(this.x, this.y);
        rotate(this.angle + 90);
        rect(-5, 0, 10, this.radius * 2);
    popMatrix();

    ellipse(this.x, this.y, this.diameter, this.diameter);

    fill(0, 0, 0, 100);
    ellipse(this.x, this.y, this.diameter - 6, this.diameter - 6);
};

gameObjects.addObject("level3Turret", createArray(Level3Turret));
gameObjects.getObject("level3Turret").isTurret = true;

var Level4Turret = function(x, y, diameter)
{
    Turret.call(this, x, y, diameter);

    this.range = 200;
    this.rangeSq = 200 * 200;
    this.shootInterval = 100;
};
Level4Turret.prototype = Object.create(Turret.prototype);
Level4Turret.prototype.shoot = function()
{
    var bullet = gameObjects.getObject("level2Bullet").add(this.x, this.y, 5);

    bullet.damage = 4;
    bullet.angle = this.angle + 180;
    bullet.range = this.range;
};
Level4Turret.prototype.draw = function()
{
    noStroke();
    fill(214, 162, 234);
    pushMatrix();
        translate(this.x, this.y);
        rotate(this.angle + 90);
        rect(-5, 0, 10, this.radius * 2);
    popMatrix();

    ellipse(this.x, this.y, this.diameter, this.diameter);

    fill(0, 0, 0, 100);
    ellipse(this.x, this.y, this.diameter - 6, this.diameter - 6);
};
gameObjects.addObject("level4Turret", createArray(Level4Turret));
gameObjects.getObject("level4Turret").isTurret = true;

var Level5Turret = function(x, y, diameter)
{
    Turret.call(this, x, y, diameter);

    this.range = 220;
    this.rangeSq = 220 * 220;
    this.shootInterval = 80;
};
Level5Turret.prototype = Object.create(Turret.prototype);
Level5Turret.prototype.shoot = function()
{
    var bullet = gameObjects.getObject("level3Bullet").add(this.x, this.y, 5);

    bullet.damage = 6;
    bullet.angle = this.angle + 180;
    bullet.range = this.range;
};
Level5Turret.prototype.draw = function()
{
    noStroke();
    fill(0, 0, 0);
    pushMatrix();
        translate(this.x, this.y);
        rotate(this.angle + 90);
        rect(-5, 0, 10, this.radius * 2);
    popMatrix();

    ellipse(this.x, this.y, this.diameter, this.diameter);

    fill(0, 0, 0, 100);
    ellipse(this.x, this.y, this.diameter - 6, this.diameter - 6);
};
gameObjects.addObject("level5Turret", createArray(Level5Turret));
gameObjects.getObject("level5Turret").isTurret = true;

var Level6Turret = function(x, y, diameter)
{
    Turret.call(this, x, y, diameter);

    this.range = 150;
    this.rangeSq = 150 * 150;
    this.shootInterval = 16;
};
Level6Turret.prototype = Object.create(Turret.prototype);
Level6Turret.prototype.shoot = function()
{
    var bullet = gameObjects.getObject("level3Bullet").add(this.x, this.y, 5);

    bullet.damage = 1;
    bullet.angle = this.angle + 180;
    bullet.range = this.range;
};
Level6Turret.prototype.draw = function()
{
    noStroke();
    fill(255, 118, 0);
    pushMatrix();
        translate(this.x, this.y);
        rotate(this.angle + 90);
        rect(-5, 0, 10, this.radius * 2);
    popMatrix();

    ellipse(this.x, this.y, this.diameter, this.diameter);

    fill(0, 0, 0, 100);
    ellipse(this.x, this.y, this.diameter - 6, this.diameter - 6);
};
gameObjects.addObject("level6Turret", createArray(Level6Turret));
gameObjects.getObject("level6Turret").isTurret = true;

gridInfo.getPosOnGrid = function(x, y)
{
    return {
        col: constrain(round((x - this.halfUnitWidth) / this.unitWidth), 0, this.plan.length - 1),
        row: constrain(round((y - this.halfUnitHeight) / this.unitHeight), 0, this.plan[0].length - 1),
    };
};

var waveController = {
    on: false,
    hp: 100,
    maxHp: 100,
    level: 0,
    wave: 1,
    waves: [],
    counter: 0,
    seCounter: 0
};

var levels = [{
    plan: [
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 2],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 2],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 2],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 2],
        [0, 1, 1, 1, 0, 0, 0, 0, 0, 2],
        [0, 0, 0, 1, 0, 0, 0, 0, 0, 2],
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 2],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 2],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 2],
        [2, 2, 2, 2, 2, 2, 2, 2, 1, 2],
    ],
    lines: [
        [90, -100, 90, 270],
        [90, 270, 210, 270],
        [210, 270, 210, 390],
        [210, 390, 510, 390],
        [510, 390, 510, 700],
    ],
    waves: [
        {
            amt: 12,
            type: ["level1Enemy"],
            addEnemyInterval: 200,
            breakTime: 600,
        },
        {
            amt: 4,
            type: ["level1Enemy"],
            addEnemyInterval: 100,
            breakTime: 600
        },
        {
            amt: 10,
            type: ["level1Enemy"],
            addEnemyInterval: 150,
            breakTime: 600
        },
        {
            amt: 10,
            type: ["level1Enemy"],
            addEnemyInterval: 100,
            breakTime: 600,
        },
        {
            amt: 5,
            type: ["level1Enemy", "level2Enemy"],
            addEnemyInterval: 200,
            breakTime: 500
        },
        {
            amt: 10,
            type: ["level1Enemy", "level2Enemy"],
            addEnemyInterval: 180,
            breakTime: 500
        },
        {
            amt: 3,
            type: ["level3Enemy", "level2Enemy", "level1Enemy"],
            addEnemyInterval: 200,
            breakTime: 400
        },
        {
            amt: 8,
            type: ["level3Enemy", "level2Enemy"],
            addEnemyInterval: 160,
            breakTime: 400
        },
        {
            amt: 14,
            type: ["level3Enemy", "level2Enemy"],
            addEnemyInterval: 150,
            breakTime: 400
        },
        {
            amt: 20,
            type: ["level3Enemy"],
            addEnemyInterval: 120,
            breakTime: 700
        },
        {
            amt: 10,
            type: ["level3Enemy"],
            addEnemyInterval: 75,
            breakTime: 500
        },
        {
            amt: 10,
            type: ["level3Enemy", "level4Enemy"],
            addEnemyInterval: 120,
            breakTime: 500
        },
        {
            amt: 6,
            type: ["level4Enemy"],
            addEnemyInterval: 50,
            breakTime: 500
        },
    ],
    draw: function()
    {
        strokeWeight(2);
        stroke(0, 8, 150);
        line(90, 0, 90, 270);
        line(90, 270, 210, 270);
        line(210, 270, 210, 390);
        line(210, 390, 510, 390);
        line(510, 390, 510, 600);
    },
    // reward: 2400
}, {
    plan: [
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 2],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 2],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 2],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 2],
        [0, 1, 0, 1, 1, 1, 0, 0, 0, 2],
        [0, 1, 0, 1, 0, 1, 0, 0, 0, 2],
        [0, 1, 0, 1, 0, 1, 1, 1, 1, 1],
        [0, 1, 0, 1, 0, 0, 0, 0, 0, 2],
        [0, 1, 1, 1, 0, 0, 0, 0, 0, 2],
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    ],
    lines: [
        [90, -100, 90, 510],
        [90, 510, 210, 510],
        [210, 510, 210, 270],
        [210, 270, 330, 270],
        [330, 270, 330, 390],
        [330, 390, 800, 390]
    ],
    waves: [
        {
            amt: 5,
            type: ["level5Enemy"],
            addEnemyInterval: 200,
            breakTime: 600
        }
    ],
    draw: function()
    {
        strokeWeight(2);
        stroke(0, 8, 150);
        line(90, 0, 90, 510);
        line(90, 510, 210, 510);
        line(210, 510, 210, 270);
        line(210, 270, 330, 270);
        line(330, 270, 330, 390);
        line(330, 390, 600, 390);
    },
    reward: 4200
}];
levels.build = function(buildIndex)
{
    gridInfo.plan = this[buildIndex].plan;
    gridInfo.draw = this[buildIndex].draw;
    gridInfo.lines = this[buildIndex].lines;
    waveController.waves = this[buildIndex].waves;
};

var levelHandler = (function()
{
    var enemies = [gameObjects.getObject("level1Enemy"), 
                   gameObjects.getObject("level2Enemy"), 
                   gameObjects.getObject("level3Enemy"), 
                   gameObjects.getObject("level4Enemy"),
                   gameObjects.getObject("level5Enemy")];

    var drawLevel = function()
    {
        var plan = gridInfo.plan;
        var unitWidth = gridInfo.unitWidth;
        var unitHeight = gridInfo.unitHeight;

        strokeWeight(2);
        stroke(255, 255, 255, 100);

        // for(var rowIndex = 0; rowIndex < plan.length; rowIndex++)
        // {
        //     line(0, rowIndex * unitHeight, plan[0].length * unitWidth, rowIndex * unitHeight);
        // }

        // for(var colIndex = 0; colIndex < plan[0].length; colIndex++)
        // {
        //     line(colIndex * unitWidth, 0, colIndex * unitWidth, plan.length * unitHeight);
        // }

        for(var rowIndex = 0; rowIndex < plan.length; rowIndex++)
        {
            for(var colIndex = 0; colIndex < plan[0].length; colIndex++)
            {   
                switch(gridInfo.plan[rowIndex][colIndex])
                {
                    case 0:
                        // image(images.grass, colIndex * gridInfo.unitWidth, rowIndex * gridInfo.unitHeight - 24, gridInfo.unitWidth, gridInfo.unitHeight * 1.4);
                        image(images.grass, colIndex * gridInfo.unitWidth, rowIndex * gridInfo.unitHeight - 35, gridInfo.unitWidth, gridInfo.unitHeight * 2);
                        break;

                    case 1:
                        image(images.water, colIndex * gridInfo.unitWidth, rowIndex * gridInfo.unitHeight - 35, gridInfo.unitWidth, gridInfo.unitHeight * 2);
                        break;

                    case 2:
                        image(images.block, colIndex * gridInfo.unitWidth, rowIndex * gridInfo.unitHeight - 35, gridInfo.unitWidth, gridInfo.unitHeight * 2);
                        break;
                }
            }
        }

        // gridInfo.draw();

        var objects;
        for(var h = 0; h < gameObjects.length; h++)
        {   
            objects = gameObjects[h];

            for(var i = objects.length - 1; i >= 0; i--)
            {
                objects[i].draw();
            }

            if(objects.isTurret)
            {
                for(var i = objects.length - 1; i >= 0; i--)
                {
                    objects[i].drawRange();
                }
            }
        }

        // fill(200, 0, 0, 100);
        // for(var rowIndex = 0; rowIndex < plan.length; rowIndex++)
        // {
        //     for(var colIndex = 0; colIndex < plan[0].length; colIndex++)
        //     {
        //         if(plan[rowIndex][colIndex] === 1)
        //         {
        //             rect(colIndex * unitWidth, rowIndex * unitHeight, unitWidth, unitHeight);
        //         }
        //     }
        // }
    };

    var lastAddEnemyTime = 0;
    var timer = 0;

    var lastSwitchTime = 0;

    var updateLevel = function()
    {
        if(!waveController.on)
        {
            return;
        }

        var wc = waveController;

        if(wc.wave <= wc.waves.length)
        {
            var index = wc.wave - 1;

            if(!wc.switching)
            {
                if(timer - lastAddEnemyTime > wc.waves[index].addEnemyInterval)
                {
                    var obj = gameObjects.getObject(wc.waves[index].type[wc.seCounter]).add(gridInfo.lines[0][0], gridInfo.lines[0][1], 30, 0);
                    wc.counter++;

                    wc.seCounter++;

                    if(wc.seCounter >= wc.waves[index].type.length)
                    {
                        wc.seCounter = 0;
                    }

                    lastAddEnemyTime = timer;
                }

                if(wc.counter >= wc.waves[index].amt)
                {
                    wc.switching = true;
                    lastSwitchTime = timer;
                }
            }
            else if(timer - lastSwitchTime > wc.waves[index].breakTime)
            {
                wc.wave++;
                wc.counter = 0;
                wc.switching = false;
                wc.seCounter = 0;
            }
        }else{
            var sum = 0;

            for(var i = 0; i < gameObjects.length; i++)
            {
                if(gameObjects[i].isEnemy)
                {
                    sum += gameObjects[i].length;
                }
            }

            if(sum === 0)
            {
                if(stats.level + 1 >= levels.length)
                {
                    scenes.switchScene("win");
                }else{
                    for(var i = 0; i < gameObjects.length; i++)
                    {
                        if(gameObjects[i].isEnemy || gameObjects[i].isTurret || gameObjects[i].isBullet)
                        {
                            gameObjects[i].length = 0;
                        }
                    }

                    stats.coins += (levels[stats.level].reward || 0);
                    levels.build(++stats.level);

                    wc.wave = 1;
                }
            }
        }

        timer++;

        var objects;
        for(var h = 0; h < gameObjects.length; h++)
        {   
            objects = gameObjects[h];

            switch(true)
            {
                case gameObjects[h].isEnemy: 
                    for(var i = objects.length - 1; i >= 0; i--)
                    {
                        if(objects[i].gone)
                        {
                            waveController.hp -= objects[i].damage;
                            objects.splice(i, 1);
                            continue;
                        }

                        if(objects[i].dead)
                        {
                            objects.splice(i, 1);
                            continue;
                        }

                        objects[i].update(gridInfo.lines);
                    }
                    break;

                case gameObjects[h].isTurret:
                    for(var i = objects.length - 1; i >= 0; i--)
                    {
                        objects[i].aim(enemies);
                        objects[i].update();
                    }
                    break;

                case gameObjects[h].isBullet:
                    for(var i = objects.length - 1; i >= 0; i--)
                    {
                        if(objects[i].dead)
                        {
                            objects.splice(i, 1);
                            continue;
                        }

                        objects[i].act(enemies);
                        objects[i].update();
                    }
                    break;
            }
        }
    };

    return {
        drawLevel: drawLevel,
        updateLevel: updateLevel
    };
}());

var buttonThemes = {
    normal: {
        font: fonts["arial black"],
        textSize: 12,
        textColor: color(0, 0, 0),
        color: color(145, 145, 145),
        highlightColor: color(200, 200, 200)
    },
    cool: {
        font: fonts["arial black"],
        textSize: 12,
        textColor: color(0, 0, 0),
        color: color(255, 255, 255, 1),
        highlightColor: color(255, 255, 255, 100),
        stroke: color(255, 255, 255)
    }
};

var Button = function(message, x, y, width, height, config)
{
    this.message = message;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.halfWidth = this.width / 2;
    this.halfHeight = this.height / 2;

    this.textSize = 10;

    for(var i in config)
    {
        this[i] = config[i];
    }
};  
Button.prototype.draw = function()
{
    fill(this.color);

    stroke(this.stroke);

    if(typeof this.stroke === "undefined")
    {
        noStroke();
    }

    rect(this.x, this.y, this.width, this.height, this.round);

    if(typeof this.highlightColor !== "undefined" && this.isMouseNear(mouseX, mouseY))
    {
        fill(this.highlightColor);
        rect(this.x, this.y, this.width, this.height, this.round);
    }

    textFont(this.font, this.textSize);
    textAlign(CENTER, CENTER);
    fill(this.textColor);
    text(this.message, this.x + this.halfWidth, this.y + this.halfHeight);

};
Button.prototype.isMouseNear = function(x, y)
{
    return (x > this.x && x < this.x + this.width) &&
           (y > this.y && y < this.y + this.height);
};
Button.prototype.isClicked = function(x, y)
{
    return mouseIsPressed &&
            (x > this.x && x < this.x + this.width) &&
            (y > this.y && y < this.y + this.height);
};

var TextButton = function(message, textSize, x, y)
{
    this.message = message;
    this.x = x;
    this.y = y;

    this.textSize = textSize;

    this.messageTextWidth = textWidth(this.message);
};
TextButton.prototype.isMouseNear = function()
{
    return Math.abs(mouseX - this.x) < this.messageTextWidth && Math.abs(mouseY - this.y) < this.textSize;
};
TextButton.prototype.draw = function()
{
    textFont(fonts["arial black"], this.textSize);
    textAlign(CENTER, CENTER);

    var extraLeft = "";
    var extraRight = "";
    if(this.isMouseNear())
    {
        extraLeft = "    ";
        extraRight = "";
    }

    text(extraLeft + this.message + extraRight, this.x, this.y);
};
TextButton.prototype.clicked = function()
{
    return mouseIsPressed && this.isMouseNear();
};

var Fade = function(colorValue)
{
    this.colorValue = colorValue;

    this.timer = 0;
    this.timerVel = 3;
    this.max = 100;
    this.fading = false;

    this.start = function(max, start)
    {
        this.max = max || this.max;
        this.timer = start || this.timer;
        this.fading = true; 
    };

    this.full = function()
    {
        return (this.timer >= this.max);
    };

    this.draw = function()
    {
        if(this.fading)
        {               
            if(!this.stopped)
            {
                if(this.timer < 0 || this.timer >= this.max)
                {
                    this.timerVel = -this.timerVel;
                }
                if(this.timer < 0)
                {
                    this.fading = false;
                }
                this.timer += this.timerVel;
            }
            noStroke();
            fill(red(this.colorValue), green(this.colorValue), blue(this.colorValue), this.timer * 255 / this.max);
            rect(0, 0, width, height);
        }
    };
};

var fade = new Fade(color(0, 0, 0));

scenes.switchScene = function(scene)
{
    fade.start();
    this.gotoScene = scene;
    this.needsScreenShot = true;
};
scenes.handleBetweenScenes = function()
{
    if(fade.full())
    {
        (this[this.scene].close || function() {})();
        this.scene = this.gotoScene;
        (this[this.scene].open || function() {})();

        this[this.scene].run();
        scenes.needsScreenShot = true;
    }
};

scenes.intro = {
    slideY: -2000,
    slideXText: -1000,
    slideXTextSpeed: 10,
    slideXTextEase: 0.9950, 
    fade: 0,
    getOutTimer: 500,
    eSize: 0,
    run: function()
    {
        fill(255, 255, 255);
        rect(0, this.slideY, width, height);

        this.slideY += 20;

        if(this.slideY > 0)
        {
            this.slideY = 0;
        }

        fill(0, 0, 0);
        textFont(fonts["arial black"], 20);
        textAlign(CENTER, CENTER);
        text("Phantom Falcon", this.slideXText, 270);

        textSize(16);
        fill(0, 0, 0, this.fade * 255 / 70);
        text("Is Back!", 300, 300);

        if(this.slideXText >= 300)
        {
            this.fade += 0.5;
            this.fade = Math.min(70, this.fade);
        }

        image(pixelImages.falcon, this.slideXText - 25, 215 - 25, 50, 50);

        strokeWeight(20);
        stroke(200, 200, 200, this.fade);
        noFill();
        beginShape();

        var gs = 120;
        for(var i = 0; i < 6; i++)
        {
            var angle = i * 360 / 6;
            vertex(300 + gs * cos(angle), 270 + gs * sin(angle));
        }
        endShape(CLOSE);

        noStroke();

        this.slideXText += this.slideXTextSpeed;

        this.slideXTextSpeed *= this.slideXTextEase;

        this.slideXTextSpeed = Math.max(1, this.slideXTextSpeed);

        if(this.slideXText > 300)
        {
            this.slideXText = 300;
        }

        this.getOutTimer--;

        if(this.getOutTimer <= 0)
        {
            noStroke();
            fill(0, 0, 0);
            beginShape();

            var gs = this.eSize;
            for(var i = 0; i < 6; i++)
            {
                var angle = i * 360 / 6;
                vertex(300 + gs * cos(angle), 270 + gs * sin(angle));
            }
            endShape(CLOSE);

            this.eSize += 20;

            if(this.eSize > 850)
            {
                scenes.switchScene("menu");
            }
        }
    }
};

scenes.menu = {
    runButton: new TextButton("Play", 20, 300, 370),
    howButton: new TextButton("How", 20, 300, 410),
    extrasButton: new TextButton("Extras", 20, 300, 450),
    run: function()
    {
        fill(255, 255, 255);

        textFont(fonts["arial black"], 60);
        textAlign(CENTER, CENTER);

        text("Tower\nDefense", 300, 197);
       
        fill(255, 255, 255, 70);
        noStroke();

        pushMatrix();
            translate(0, -300);
            rotate(60);
            rect(0, 0, 2000, 140);
        popMatrix();

        pushMatrix();
            translate(100, -300);
            rotate(60);
            rect(0, 0, 2000, 34);
        popMatrix();

        fill(255, 255, 255);
        this.runButton.draw();
        this.howButton.draw();
        this.extrasButton.draw();

        if(this.runButton.clicked())
        {
            scenes.switchScene("play");
        }
        else if(this.howButton.clicked())
        {
            scenes.switchScene("how");
        }
        else if(this.extrasButton.clicked())
        {
            scenes.switchScene("extras");
        }
    }
};

var infoBar = {
    hpBar: new Bar(0, 0, 200, 28),
    buttons: {
        play: new Button("Play", 520, 0, 80, 28, buttonThemes.cool)
    },
    init: function()
    {
        this.hpBar.barColor = color(0, 223, 30);
    },
    draw: function()
    {
        noStroke();
        fill(255, 255, 255, 100);
        rect(0, 0, 600, 30);

        fill(0, 0, 0);
        textAlign(LEFT, CENTER);
        text("Wave " + waveController.wave + "   Level: " + (stats.level + 1), 308, 15);
        text("Coins: " + stats.coins , 220, 15);
    
        for(var i in this.buttons)
        {
            this.buttons[i].draw();
        }

        this.hpBar.draw();

        fill(0, 0, 0);
        text("Hp " + waveController.hp + " / " + waveController.maxHp, 100, 15);

        this.hpBar.amt = waveController.hp;
        this.hpBar.max = waveController.maxHp;

        if(this.hpBar.amt <= 20)
        {
            this.hpBar.barColor = color(200, 23, 7);
        }

        if(this.buttons.play.isMouseNear(mouseX, mouseY))
        {   
            cursor(HAND);
        }
    },
    mousePressed: function()
    {
        if(this.buttons.play.isMouseNear(mouseX, mouseY))
        {
            if(this.buttons.play.message === "Play")
            {
                waveController.on = true;
                this.buttons.play.message = "Stop";
            }else{
                waveController.on = false;
                this.buttons.play.message = "Play";
            }
        }
    }
};

var normalDraw = function()
{
    this.turret.draw();

    noFill();
    stroke(200, 200, 255);

    if(this.isLocked())
    {
        fill(255, 0, 0, 70);
    }
    else if(this.hoverOver)
    {
        fill(255, 255, 255, 100);
        cursor(HAND);
    }

    rect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
};

scenes.play = {
    hanger: {
        draw: function()
        {
            if(typeof this.holding === "object")
            {
                cursor(MOVE);
                this.holding.x = mouseX;
                this.holding.y = mouseY;
                this.holding.draw();
            }
        },
        remove: function()
        {
            delete this.holding;
            delete this.cost;
        },
        drop: function(pos)
        {
            var turret = gameObjects.getObject(this.holding.name).add(pos.col * gridInfo.unitWidth + gridInfo.halfUnitWidth, 
                                                         pos.row * gridInfo.unitHeight + gridInfo.halfUnitHeight, 30);

            turret.placed = true;

            stats.coins -= this.cost;

            delete this.holding;
            delete this.cost;
        }
    },
    turretsMenu: {
        hideButton: new Button("v", 580, 505, 20, 20, buttonThemes.cool),
        slideY: 525,
        slides: [{
            cost: 150,
            bounds: {
                x: 525,
                y: 525,
                width: 75,
                height: 75
            },
            draw: normalDraw,
            init: function()
            {
                this.turret = new Level1Turret(this.bounds.x + this.bounds.width / 2, this.bounds.y + this.bounds.height / 2, 30);
            },
            isLocked: function()
            {
                return stats.coins < this.cost;
            },
            update: function(scene)
            {
                this.hoverOver = (mouseX > this.bounds.x && mouseX < this.bounds.x + this.bounds.width &&
                                  mouseY > this.bounds.y && mouseY < this.bounds.y + this.bounds.height);

                if(mouseIsPressed && this.hoverOver && typeof scene.hanger.holding === "undefined" && !this.isLocked())
                {
                    scene.hanger.holding = new Level1Turret(this.bounds.x + this.bounds.width / 2, this.bounds.y + this.bounds.height / 2, 30);
                    scene.hanger.holding.name = "level1Turret";
                    scene.hanger.cost = this.cost;
                }
            }
        }, 
        {
            cost: 250,
            bounds: {
                x: 450,
                y: 525,
                width: 75,
                height: 75
            },
            draw: normalDraw,
            init: function()
            {
                this.turret = new Level2Turret(this.bounds.x + this.bounds.width / 2, this.bounds.y + this.bounds.height / 2, 30);
            },
            isLocked: function()
            {
                return stats.coins < this.cost;
            },
            update: function(scene)
            {
                this.hoverOver = (mouseX > this.bounds.x && mouseX < this.bounds.x + this.bounds.width &&
                                  mouseY > this.bounds.y && mouseY < this.bounds.y + this.bounds.height);

                if(mouseIsPressed && this.hoverOver && typeof scene.hanger.holding === "undefined" && !this.isLocked())
                {
                    scene.hanger.holding = new Level2Turret(this.bounds.x + this.bounds.width / 2, this.bounds.y + this.bounds.height / 2, 30);
                    scene.hanger.holding.name = "level2Turret";
                    scene.hanger.cost = this.cost;
                }
            }
        },
        {
            cost: 750,
            bounds: {
                x: 375,
                y: 525,
                width: 75,
                height: 75
            },
            draw: normalDraw,
            init: function()
            {
                this.turret = new Level3Turret(this.bounds.x + this.bounds.width / 2, this.bounds.y + this.bounds.height / 2, 30);
            },
            isLocked: function()
            {
                return stats.coins < this.cost;
            },
            update: function(scene)
            {
                this.hoverOver = (mouseX > this.bounds.x && mouseX < this.bounds.x + this.bounds.width &&
                                  mouseY > this.bounds.y && mouseY < this.bounds.y + this.bounds.height);

                if(mouseIsPressed && this.hoverOver && typeof scene.hanger.holding === "undefined" && !this.isLocked())
                {
                    scene.hanger.holding = new Level3Turret(this.bounds.x + this.bounds.width / 2, this.bounds.y + this.bounds.height / 2, 30);
                    scene.hanger.holding.name = "level3Turret";
                    scene.hanger.cost = this.cost;
                }
            }
        }, 
        {
            cost: 1250,
            bounds: {
                x: 300,
                y: 525,
                width: 75,
                height: 75
            },
            draw: normalDraw,
            init: function()
            {
                this.turret = new Level4Turret(this.bounds.x + this.bounds.width / 2, this.bounds.y + this.bounds.height / 2, 30);
            },
            isLocked: function()
            {
                return stats.coins < this.cost;
            },
            update: function(scene)
            {
                this.hoverOver = (mouseX > this.bounds.x && mouseX < this.bounds.x + this.bounds.width &&
                                  mouseY > this.bounds.y && mouseY < this.bounds.y + this.bounds.height);

                if(mouseIsPressed && this.hoverOver && typeof scene.hanger.holding === "undefined" && !this.isLocked())
                {
                    scene.hanger.holding = new Level4Turret(this.bounds.x + this.bounds.width / 2, this.bounds.y + this.bounds.height / 2, 30);
                    scene.hanger.holding.name = "level4Turret";
                    scene.hanger.cost = this.cost;
                }
            }
        }, 
        {
            cost: 1800,
            bounds: {
                x: 225,
                y: 525,
                width: 75,
                height: 75
            },
            draw: normalDraw,
            init: function()
            {
                this.turret = new Level5Turret(this.bounds.x + this.bounds.width / 2, this.bounds.y + this.bounds.height / 2, 30);
            },
            isLocked: function()
            {
                return stats.coins < this.cost;
            },
            update: function(scene)
            {
                this.hoverOver = (mouseX > this.bounds.x && mouseX < this.bounds.x + this.bounds.width &&
                                  mouseY > this.bounds.y && mouseY < this.bounds.y + this.bounds.height);

                if(mouseIsPressed && this.hoverOver && typeof scene.hanger.holding === "undefined" && !this.isLocked())
                {
                    scene.hanger.holding = new Level5Turret(this.bounds.x + this.bounds.width / 2, this.bounds.y + this.bounds.height / 2, 30);
                    scene.hanger.holding.name = "level5Turret";
                    scene.hanger.cost = this.cost;
                }
            }
        }, 
        {
            cost: 2000,
            bounds: {
                x: 150,
                y: 525,
                width: 75,
                height: 75
            },
            draw: normalDraw,
            init: function()
            {
                this.turret = new Level6Turret(this.bounds.x + this.bounds.width / 2, this.bounds.y + this.bounds.height / 2, 30);
            },
            isLocked: function()
            {
                return stats.coins < this.cost;
            },
            update: function(scene)
            {
                this.hoverOver = (mouseX > this.bounds.x && mouseX < this.bounds.x + this.bounds.width &&
                                  mouseY > this.bounds.y && mouseY < this.bounds.y + this.bounds.height);

                if(mouseIsPressed && this.hoverOver && typeof scene.hanger.holding === "undefined" && !this.isLocked())
                {
                    scene.hanger.holding = new Level6Turret(this.bounds.x + this.bounds.width / 2, this.bounds.y + this.bounds.height / 2, 30);
                    scene.hanger.holding.name = "level6Turret";
                    scene.hanger.cost = this.cost;
                }
            }
        }],
    },
    init: function()
    {
        infoBar.init();

        for(var i = 0; i < this.turretsMenu.slides.length; i++)
        {
            this.turretsMenu.slides[i].init();
        }
    },
    run: function()
    {
        levelHandler.drawLevel();
        levelHandler.updateLevel();

        if(waveController.hp <= 0)
        {
            scenes.switchScene("gameOver");
        }

        if(keys.m)
        {
            scenes.switchScene("menu");
        }

        this.hanger.draw();

        if(typeof this.hanger.holding === "object")
        {
            var pos = gridInfo.getPosOnGrid(mouseX, mouseY);

            if(gridInfo.plan[pos.row][pos.col] === 0)
            {
                fill(255, 255, 255, 70);
                rect(pos.col * gridInfo.unitWidth, pos.row * gridInfo.unitHeight, gridInfo.unitWidth, gridInfo.unitHeight);
                if(!mouseIsPressed)
                {
                    this.hanger.drop(pos);
                }
            }else{
                fill(255, 0, 0, 70);
                rect(pos.col * gridInfo.unitWidth, pos.row * gridInfo.unitHeight, gridInfo.unitWidth, gridInfo.unitHeight);

                if(!mouseIsPressed)
                {
                    this.hanger.remove();
                }
            }
        }

        noStroke();
        fill(255, 255, 255, 100);
        rect(0, this.turretsMenu.slides[0].bounds.y, width, 100);

        pushMatrix();
        for(var i = 0; i < this.turretsMenu.slides.length; i++)
        {
            this.turretsMenu.slides[i].draw();
        }
        popMatrix();

        for(var i = 0; i < this.turretsMenu.slides.length; i++)
        {
            this.turretsMenu.slides[i].update(this);
        }

        this.turretsMenu.hideButton.draw();

        if(this.turretsMenu.slidingDown)
        {
            this.turretsMenu.slideY += 5;
            for(var i = 0; i < this.turretsMenu.slides.length; i++)
            {
                this.turretsMenu.slides[i].bounds.y = this.turretsMenu.slideY;
                this.turretsMenu.slides[i].turret.y += 5;
            }

            this.turretsMenu.hideButton.y = this.turretsMenu.slideY - this.turretsMenu.hideButton.height;

            if(this.turretsMenu.slideY > height - 5)
            {
                this.turretsMenu.hideButton.message = "^";
                this.turretsMenu.slideY = height - 5;
                this.turretsMenu.slidingDown = false;
            }
        }
        else if(this.turretsMenu.slidingUp)
        {
            this.turretsMenu.slideY -= 5;
            for(var i = 0; i < this.turretsMenu.slides.length; i++)
            {
                this.turretsMenu.slides[i].bounds.y = this.turretsMenu.slideY;
                this.turretsMenu.slides[i].turret.y -= 5;
            }

            this.turretsMenu.hideButton.y = this.turretsMenu.slideY - this.turretsMenu.hideButton.height;

            if(this.turretsMenu.slideY < 525)
            {
                this.turretsMenu.hideButton.message = "v";
                this.turretsMenu.slideY = 525;
                this.turretsMenu.slidingUp = false;
            }
        }

        for(var i in this.buttons)
        {
            this.buttons[i].draw();
        }

        infoBar.draw();
    },
    mousePressed: function()
    {
        infoBar.mousePressed();

        if(this.turretsMenu.hideButton.isMouseNear(mouseX, mouseY))
        {
            if(this.turretsMenu.slideY < height - 5)
            {
                this.turretsMenu.slidingDown = true;
            }else{
                this.turretsMenu.slidingUp = true;
            }
        }
    }
};

scenes.how = {
    buttons: {
        menu: new Button("Menu", 20, 560, 80, 20, buttonThemes.normal)
    },
    run: function()
    {
        if(this.buttons.menu.isClicked(mouseX, mouseY))
        {
            scenes.switchScene("menu");
        }

        for(var i in this.buttons)
        {
            this.buttons[i].draw();
        }
    }
};

scenes.extras = {
    buttons: {
        menu: new Button("Menu", 20, 560, 80, 20, buttonThemes.normal)
    },
    run: function()
    {
        if(this.buttons.menu.isClicked(mouseX, mouseY))
        {
            scenes.switchScene("menu");
        }

        for(var i in this.buttons)
        {
            this.buttons[i].draw();
        }
    }
};

scenes.gameOver = {
    run: function()
    {
        background(200, 0, 0);

        textFont(fonts["arial black"], 30);
        textAlign(CENTER, CENTER);
        fill(0, 0, 0);
        text("Game Over!", 300, 300);
    }
};

scenes.win = {
    run: function()
    {
        background(0, 200, 23);
        textFont(fonts["arial black"], 30);
        textAlign(CENTER, CENTER);
        fill(0, 0, 0);
        text("You win!", 300, 300);
    }
};

var setup = (function()
{
    levels.build(stats.level);

    for(var i in scenes)
    {
        if(typeof scenes[i] === "object" && typeof scenes[i].init === "function")
        {
            scenes[i].init();
        }
    }
}());

scenes.run = function()
{
    if(!fade.fading)
    {
        scenes[scenes.scene].run();
    }else{
        scenes.handleBetweenScenes();

        if(scenes.screenShot && !scenes.needsScreenShot)
        {
            image(scenes.screenShot, 0, 0, width, height);
        }
    }

    if(scenes.needsScreenShot)
    {
        scenes.screenShot = get(0, 0, width, height);
        scenes.needsScreenShot = false;
    }
};

draw = function()
{
    cursor(ARROW);
    background(0, 0, 0);

    scenes.run();
    fade.draw();
};

mousePressed = function()
{
    if(typeof scenes[scenes.scene].mousePressed === "function")
    {
        scenes[scenes.scene].mousePressed();
    }
};


}

createProcessing(main);