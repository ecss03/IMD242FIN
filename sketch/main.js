// 종횡비를 고정하고 싶을 경우: 아래 두 변수를 0이 아닌 원하는 종, 횡 비율값으로 설정.
// 종횡비를 고정하고 싶지 않을 경우: 아래 두 변수 중 어느 하나라도 0으로 설정.
const aspectW = 4;
const aspectH = 3;
// html에서 클래스명이 container-canvas인 첫 엘리먼트: 컨테이너 가져오기.
const container = document.body.querySelector('.container-canvas');
// 필요에 따라 이하에 변수 생성.

const animals = [
  '🐶',
  '🐱',
  '🐻',
  '🐼',
  '🐯',
  '🐨',
  '🦁',
  '🐘',
  '🦓',
  '🦒',
  '🦔',
  '🐑',
  '🦝',
  '🐇',
  '🦜',
  '❤️',
  '💗',
  '💖',
  '💘',
  '💝',
];

let randomAnimals = [];
let video;
let handPose;
let hands = [];
let isGrabbing = false;
let grabbedAnimal = null;
let startTime;
let timeElapsed = 0;
let animalCount = 15;

function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  // 컨테이너의 현재 위치, 크기 등의 정보 가져와서 객체구조분해할당을 통해 너비, 높이 정보를 변수로 추출.
  const { width: containerW, height: containerH } =
    container.getBoundingClientRect();
  // 종횡비가 설정되지 않은 경우:
  // 컨테이너의 크기와 일치하도록 캔버스를 생성하고, 컨테이너의 자녀로 설정.
  if (aspectW === 0 || aspectH === 0) {
    createCanvas(containerW, containerH).parent(container);
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 클 경우:
  // 컨테이너의 세로길이에 맞춰 종횡비대로 캔버스를 생성하고, 컨테이너의 자녀로 설정.
  else if (containerW / containerH > aspectW / aspectH) {
    createCanvas((containerH * aspectW) / aspectH, containerH).parent(
      container
    );
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 작거나 같을 경우:
  // 컨테이너의 가로길이에 맞춰 종횡비대로 캔버스를 생성하고, 컨테이너의 자녀로 설정.
  else {
    createCanvas(containerW, (containerW * aspectH) / aspectW).parent(
      container
    );
  }
  init();
  // createCanvas를 제외한 나머지 구문을 여기 혹은 init()에 작성.
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  handPose.detectStart(video, gotHands);
  // 15개의 랜덤 동물 이모티콘을 생성, 배열에 저장
  for (let i = 0; i < 15; i++) {
    const animal = random(animals);
    const x = random(width);
    const y = random(height);
    randomAnimals.push({ animal, x, y }); // 동물과 좌표를 배열에 저장
  }
  // 선택하기 시작할 때
  startTime = millis();
}

// windowResized()에서 setup()에 준하는 구문을 실행해야할 경우를 대비해 init이라는 명칭의 함수를 만들어 둠.
function init() {}

function draw() {
  background('white');

  image(video, 0, 0, width, height);

  // 랜덤 동물 이모티콘을 화면에 표시
  randomAnimals.forEach((animalData) => {
    textSize(50);

    text(animalData.animal, animalData.x, animalData.y); // 동물 이모티콘을 화면에 그리기
  });

  if (hands.length > 0) {
    let index = hands[0].keypoints[8];
    let thumb = hands[0].keypoints[4];

    let indexX = map(index.x, 0, video.width, 0, width);
    let indexY = map(index.y, 0, video.height, 0, height);
    let thumbX = map(thumb.x, 0, video.width, 0, width);
    let thumbY = map(thumb.y, 0, video.height, 0, height);

    // 좌표 점 찍기
    fill(255, 0, 0);
    noStroke();
    ellipse(indexX, indexY, 10, 10); // 검지 좌표에 원 그리기
    ellipse(thumbX, thumbY, 10, 10); // 엄지 좌표에 원 그리기

    noFill();
    stroke(0, 255, 0);
    textSize(18);
    text('동물', indexX + 10, indexY);
    text('사랑', thumbX + 10, thumbY);

    // 두 손가락 간의 거리 계산
    let distance = dist(indexX, indexY, thumbX, thumbY);

    // 손가락이 가까워지면 잡는 상태로 간주
    isGrabbing = distance < 50;

    // 텍스트 색상 변경 (잡으면 초록색, 잡기 전엔 흰색)
    fill(isGrabbing ? 'green' : 'white');
    noStroke();
    textSize(18);
    text('동물', indexX + 10, indexY);
    text('사랑', thumbX + 10, thumbY);

    // 뽑는 상태일 때 이모티콘 잡기8
    if (isGrabbing) {
      // 동물 이모티콘 중 손가락 위치에 가까운 것을 찾기
      randomAnimals.forEach((animalData) => {
        let animalDistance = dist(indexX, indexY, animalData.x, animalData.y);
        if (animalDistance < 50 && !grabbedAnimal) {
          grabbedAnimal = animalData; // 동물 이모티콘 잡기
        }
      });

      // 잡힌 동물 이모티콘 좌표를 두 손가락 사이의 중간 지점으로 이동
      if (grabbedAnimal) {
        let midX = (indexX + thumbX) / 2; // 두 손가락 사이의 중간 X
        let midY = (indexY + thumbY) / 2; // 두 손가락 사이의 중간 Y
        grabbedAnimal.x = midX;
        grabbedAnimal.y = midY;

        // 동물 이모티콘을 뽑으면 없애기
        if (frameCount % 10 === 0) {
          // 일정 간격마다 동물 이모티콘을 "뽑았다"고 처리 (타이머처럼)
          let animalDistance = dist(
            midX,
            midY,
            grabbedAnimal.x,
            grabbedAnimal.y
          );
          if (animalDistance < 10) {
            let index = randomAnimals.indexOf(grabbedAnimal);
            if (index > -1) {
              randomAnimals.splice(index, 1); // 동물 이모티콘 삭제
              animalCount--; // 남은 동물 개수 감소
              grabbedAnimal = null; // 잡은 동물 이모티콘을 놓기
            }
          }
        }
      }
    } else {
      grabbedAnimal = null;
    }
  }

  // 다 뽑을때 까지 시간 측정 및 텍스트 표시
  timeElapsed = millis() - startTime;
  let minutes = Math.floor(timeElapsed / 60000);
  let seconds = Math.floor((timeElapsed % 60000) / 1000);

  // 남은 동물 개수와 시간 표시
  fill(0);
  textAlign(CENTER, TOP);
  textSize(24);
  text(`남은 동물 개수: ${animalCount}`, width / 2, 20);
  text(`다 먹는 데 걸린 시간: ${minutes}:${seconds}`, width / 2, 50);

  // 모든 동물을 뽑으면 멈추기
  if (animalCount === 0) {
    noLoop();
    textSize(32);
    text('사랑스러운 동물들은 다 내꺼!', width / 2, height / 2);
  }
}

function gotHands(results) {
  hands = results;
}

function windowResized() {
  // 컨테이너의 현재 위치, 크기 등의 정보 가져와서 객체구조분해할당을 통해 너비, 높이 정보를 변수로 추출.
  const { width: containerW, height: containerH } =
    container.getBoundingClientRect();
  // 종횡비가 설정되지 않은 경우:
  // 컨테이너의 크기와 일치하도록 캔버스를 조정.
  if (aspectW === 0 || aspectH === 0) {
    resizeCanvas(containerW, containerH);
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 클 경우:
  // 컨테이너의 세로길이에 맞춰 종횡비대로 캔버스 크기를 조정.
  else if (containerW / containerH > aspectW / aspectH) {
    resizeCanvas((containerH * aspectW) / aspectH, containerH);
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 작거나 같을 경우:
  // 컨테이너의 가로길이에 맞춰 종횡비대로 캔버스 크기를 조정.
  else {
    resizeCanvas(containerW, (containerW * aspectH) / aspectW);
  }
  // 위 과정을 통해 캔버스 크기가 조정된 경우, 다시 처음부터 그려야할 수도 있다.
  // 이런 경우 setup()의 일부 구문을 init()에 작성해서 여기서 실행하는게 편리하다.
  // init();
}
