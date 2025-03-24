// ml5.js의 handPose 모델과 p5.js를 이용하여 인터랙티브 드로잉, 삭제, 색상 선택, 이모티콘 애니메이션을 구현하는 코드

// --------------------------------
// 전역 변수 선언
// --------------------------------

// 손 관절 정보와 관련 변수
let handPose;              // ml5의 handPose 모델 객체
let video;                 // 웹캠 비디오 캡처 객체
let hands = [];            // handPose 모델로부터 받은 손 관절 데이터 배열

// 칠판용 오프스크린 그래픽스 (그림이나 글씨를 그릴 캔버스)
let board;

// 반응(이모지) 버튼 관련 변수
let reactionButtons = [];  // 화면 좌측 상단에 배치되는 반응 이모지 버튼들 (예: 👍, 👎, ❤️, 👏)
let clearButton;           // 지우개 이모티콘 버튼 (화면 우측 상단) : 삭제 옵션 활성화
let reactions = [];        // 버튼 클릭 시 나타나는 이모지 애니메이션 효과 객체들을 저장하는 배열

// 색상 선택 관련 변수
let colorButton;           // 팔레트 이모티콘 버튼 (색상 선택 버튼)
let colorOptions = [];     // 10가지 색상 옵션 (2행×5열 배열로 표시)
let showColorOptions = false; // 색상 옵션 팔레트의 표시 여부
let currentColor = "black";   // 현재 드로잉 색상 (기본은 검정색)

// 드로잉 관련 변수
let prevX = null;          // 이전 프레임에서의 인덱스 손가락 x좌표 (선 연결용)
let prevY = null;          // 이전 프레임에서의 인덱스 손가락 y좌표 (선 연결용)
let lastTriggerTime = {};  // 버튼(또는 옵션) 클릭 시각 저장(쿨다운 적용용)
let cooldown = 1000;       // 버튼 연속 클릭 방지용 쿨다운 시간 (1초)

// 핀치 제스쳐 판정 기준 : 엄지와 검지 사이의 거리가 이 값보다 작으면 핀치로 간주
const PINCH_THRESHOLD = 20;

// 삭제 옵션 관련 변수
let showDeleteOptions = false; // 지우개 버튼 클릭 시 "전체 삭제", "부분 삭제" 옵션 표시 여부
let deleteOptions = [];        // 삭제 옵션 버튼 객체 배열 (각 객체에 label, x, y, w, h 정보 포함)
let partialDeletionMode = false; // 부분 삭제 모드 활성화 여부 (true면 부분 삭제 모드)
let lastNoPinchTime = 0;         // 핀치 제스쳐가 해제된 마지막 시각 (부분 삭제 모드 종료 타이밍 체크용)

// --------------------------------
// preload() 함수: 모델 로딩 등 사전 준비 작업
// --------------------------------
function preload() {
  // ml5.handPose() 모델 로드 (거울 모드 옵션은 detectStart에서 적용됨)
  handPose = ml5.handPose();
}

// --------------------------------
// setup() 함수: 캔버스 및 초기 설정
// --------------------------------
function setup() {
  createCanvas(640, 480);

  // 웹캠 캡처 설정 (해상도 및 거울 모드 적용)
  video = createCapture({
    video: {
      width: 640,
      height: 480,
      facingMode: "user"  // 전면 카메라(거울 모드)
    }
  }, function() {
    console.log("웹캠을 불러왔습니다.");
  });
  video.size(640, 480);
  video.hide();  // 비디오 DOM은 숨기고, 캔버스에 직접 그립니다.

  // handPose 모델 시작: 모델이 새 예측 데이터를 받으면 gotHands() 콜백으로 결과 업데이트
  handPose.detectStart(video, gotHands);

  // 오프스크린 칠판 생성: board에 그리는 내용은 나중에 메인 캔버스에 표시됩니다.
  board = createGraphics(width, height);
  board.clear();

  // ------------------------------
  // 반응(이모지) 버튼 설정 (좌측 상단)
  // ------------------------------
  reactionButtons.push({ label: "👍", x: 20,  y: 10, w: 80, h: 80 });
  reactionButtons.push({ label: "👎", x: 120, y: 10, w: 80, h: 80 });
  reactionButtons.push({ label: "❤️", x: 220, y: 10, w: 80, h: 80 });
  reactionButtons.push({ label: "👏", x: 320, y: 10, w: 80, h: 80 });

  // --------------------------------
  // Clear 버튼 (지우개 이모티콘) 설정 (우측 상단)
  // --------------------------------
  clearButton = { label: "🧽", x: width - 100, y: 10, w: 80, h: 80 };

  // --------------------------------
  // 색상 선택 버튼 (팔레트 이모티콘) 설정 (왼쪽 중간 영역)
  // --------------------------------
  colorButton = { label: "🎨", x: 20, y: 200, w: 80, h: 80 };

  // --------------------------------
  // 색상 옵션 팔레트 생성 (2행 × 5열, 총 10가지 색상)
  // 색상 이름은 임의 선택 (예: Matplotlib 색상)
  // --------------------------------
  let colorNames = [
    "crimson", "gold", "limegreen", "deepskyblue", "darkviolet",
    "orange",  "gray", "saddlebrown", "magenta", "cyan"
  ];
  
  // 팔레트 버튼 아래에 옵션을 표시 (간격 및 크기 설정)
  let startX = colorButton.x;
  let startY = colorButton.y + colorButton.h + 10;
  let boxSize = 30;
  let gap = 10;  // 색상 사각형 간 간격

  // 2행 x 5열로 colorOptions 배열 생성
  let idx = 0;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 5; col++) {
      let cx = startX + col * (boxSize + gap);
      let cy = startY + row * (boxSize + gap);
      colorOptions.push({
        colorName: colorNames[idx],
        x: cx,
        y: cy,
        w: boxSize,
        h: boxSize
      });
      idx++;
    }
  }
}

// --------------------------------
// draw() 함수: 매 프레임마다 호출되어 화면을 업데이트
// --------------------------------
function draw() {
  background(220);

  // --------------------------------
  // 웹캠 영상을 거울 모드로 그리기
  // --------------------------------
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  // --------------------------------
  // 칠판(오프스크린 그래픽스) 내용을 메인 캔버스에 표시
  // --------------------------------
  image(board, 0, 0);

  // --------------------------------
  // 설정된 버튼들을 그리기
  // --------------------------------
  drawReactionButtons();  // 반응(이모지) 버튼들 (좌측 상단)
  drawClearButton();        // Clear (지우개) 버튼 (우측 상단)
  drawColorButton();        // 팔레트 버튼 (색상 선택) (왼쪽 중간)

  // 삭제 옵션 버튼 ("전체 삭제", "부분 삭제")가 활성화된 경우 계속 표시
  if (showDeleteOptions) {
    drawDeleteOptions();
  }
  // 색상 옵션 버튼(팔레트의 색상 사각형) 표시
  if (showColorOptions) {
    drawColorOptions();
  }

  // --------------------------------
  // 손 관절 정보(제스쳐) 처리
  // --------------------------------
  if (hands.length > 0) {
    // 첫 번째 손 데이터만 사용
    let hand = hands[0];
    let keypoints = hand.keypoints;

    // 엄지(인덱스 4)와 검지(인덱스 8) 위치 추출
    let thumbTip = keypoints[4];
    let indexTip = keypoints[8];

    // 거울 모드이므로 x좌표를 반전하여 실제 화면 좌표로 변환
    let xThumb = width - thumbTip.x;
    let yThumb = thumbTip.y;
    let xIndex = width - indexTip.x;
    let yIndex = indexTip.y;

    // 엄지와 검지 사이의 거리를 계산 (핀치 제스쳐 판별용)
    let d = dist(xThumb, yThumb, xIndex, yIndex);
    let currentTime = millis();

    // --------------------------------
    // 핀치 제스쳐 처리
    // --------------------------------
    if (d < PINCH_THRESHOLD) {
      // 만약 부분 삭제 모드(partialDeletionMode)가 활성화되어 있다면,
      // 핀치 제스쳐 시 해당 영역을 지우도록 처리
      if (partialDeletionMode) {
        // board.erase() 모드를 사용하여 지울 영역을 원으로 표시
        board.erase();
        board.noFill();
        board.strokeWeight(50);
        board.circle(xIndex, yIndex, 50);
        board.noErase();

        // 메인 캔버스에도 삭제 영역을 안내하기 위해 반투명 원 표시
        fill(255, 0, 0, 128);
        noStroke();
        ellipse(xIndex, yIndex, 50);

        // 부분 삭제 동작 중에는 이전 좌표 초기화
        prevX = null;
        prevY = null;
      } else {
        // 일반 드로잉 모드 (핀치 제스쳐로 그림 그리기)
        // 단, 상단 버튼 영역(대략 y < 100)은 제외하여 버튼과 겹치지 않게 함
        if (yIndex > 100) {
          // 현재 선택된 색상(currentColor)으로 선 색상을 설정
          board.stroke(currentColor);
          board.strokeWeight(4);
          // 이전 좌표가 존재하면 두 좌표 사이에 선 그리기
          if (prevX !== null && prevY !== null) {
            board.line(prevX, prevY, xIndex, yIndex);
          }
          // 현재 좌표를 저장하여 다음 프레임에 연결
          prevX = xIndex;
          prevY = yIndex;
        }
      }
    } else {
      // 핀치 제스쳐가 해제되면
      prevX = null;
      prevY = null;
      lastNoPinchTime = currentTime;

      // ----------------------------
      // (a) 반응 버튼 (이모지) 처리
      // ----------------------------
      checkReactionButtons(xIndex, yIndex, currentTime);

      // ----------------------------
      // (b) Clear 버튼(지우개) 처리: 버튼 위에 손이 있을 경우 삭제 옵션을 활성화
      // ----------------------------
      checkClearButton(xIndex, yIndex, currentTime);

      // ----------------------------
      // (c) 팔레트 버튼 처리: 손이 팔레트 버튼 영역에 들어가면 색상 옵션 표시
      // ----------------------------
      checkColorButton(xIndex, yIndex, currentTime);

      // ----------------------------
      // (d) 삭제 옵션 버튼 처리: 삭제 옵션 버튼 선택 시 전체 삭제 또는 부분 삭제 모드 활성화
      // ----------------------------
      if (showDeleteOptions) {
        for (let opt of deleteOptions) {
          if (xIndex > opt.x && xIndex < opt.x + opt.w &&
              yIndex > opt.y && yIndex < opt.y + opt.h) {
            if (!lastTriggerTime[opt.label] || currentTime - lastTriggerTime[opt.label] > cooldown) {
              if (opt.label === "전체 삭제") {
                clearBoard();
                partialDeletionMode = false;
              } else if (opt.label === "부분 삭제") {
                partialDeletionMode = true;
              }
              lastTriggerTime[opt.label] = currentTime;
              showDeleteOptions = false;
              deleteOptions = [];
            }
          }
        }
      }

      // ----------------------------
      // (e) 색상 옵션 버튼 처리: 색상 옵션에서 원하는 색상 선택 시 currentColor 갱신
      // 색상을 선택하면 부분 삭제 모드 해제
      // ----------------------------
      if (showColorOptions) {
        for (let opt of colorOptions) {
          if (xIndex > opt.x && xIndex < opt.x + opt.w &&
              yIndex > opt.y && yIndex < opt.y + opt.h) {
            if (!lastTriggerTime[opt.colorName] || currentTime - lastTriggerTime[opt.colorName] > cooldown) {
              // 색상 선택 시 부분 삭제 모드를 끔
              partialDeletionMode = false;
              // 선택한 색상으로 currentColor 변경
              currentColor = opt.colorName;
              // 색상 옵션 창 닫기
              showColorOptions = false;
              lastTriggerTime[opt.colorName] = currentTime;
            }
          }
        }
      }
    }

    // --------------------------------
    // (디버그) 인덱스 손가락 끝 위치 표시 (빨간 원)
    // --------------------------------
    fill(255, 0, 0);
    noStroke();
    ellipse(xIndex, yIndex, 10);
  }

  // --------------------------------
  // 반응(이모지) 애니메이션 업데이트 및 그리기
  // --------------------------------
  updateReactions();
}

// --------------------------------
// handPose.detectStart()의 콜백 함수
// 새로운 손 관절 데이터가 들어오면 hands 배열 업데이트
// --------------------------------
function gotHands(results) {
  hands = results;
}

// --------------------------------
// 버튼 및 옵션 그리기 함수들
// --------------------------------

// 반응(이모지) 버튼 그리기 (좌측 상단)
function drawReactionButtons() {
  for (let btn of reactionButtons) {
    fill(200);
    stroke(0);
    rect(btn.x, btn.y, btn.w, btn.h, 10);
    textAlign(CENTER, CENTER);
    textSize(32);
    fill(0);
    text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
  }
}

// Clear 버튼(지우개 이모티콘) 그리기 (우측 상단)
function drawClearButton() {
  fill(180);
  stroke(0);
  rect(clearButton.x, clearButton.y, clearButton.w, clearButton.h, 10);
  textAlign(CENTER, CENTER);
  textSize(32);
  fill(0);
  text(clearButton.label, clearButton.x + clearButton.w / 2, clearButton.y + clearButton.h / 2);
}

// 팔레트 버튼(색상 선택) 그리기 (왼쪽 중간)
function drawColorButton() {
  fill(180);
  stroke(0);
  rect(colorButton.x, colorButton.y, colorButton.w, colorButton.h, 10);
  textAlign(CENTER, CENTER);
  textSize(32);
  fill(0);
  text(colorButton.label, colorButton.x + colorButton.w / 2, colorButton.y + colorButton.h / 2);
}

// "전체 삭제", "부분 삭제" 옵션 버튼 그리기
function drawDeleteOptions() {
  for (let opt of deleteOptions) {
    fill(220);
    stroke(0);
    rect(opt.x, opt.y, opt.w, opt.h, 5);
    textAlign(CENTER, CENTER);
    textSize(16);
    fill(0);
    text(opt.label, opt.x + opt.w / 2, opt.y + opt.h / 2);
  }
}

// 색상 옵션 팔레트 그리기 (2행 x 5열)
function drawColorOptions() {
  for (let opt of colorOptions) {
    fill(opt.colorName);
    stroke(0);
    rect(opt.x, opt.y, opt.w, opt.h, 5);
  }
}

// --------------------------------
// 버튼 클릭 판정 로직 함수들
// 각 버튼 영역에 손가락(인덱스)이 들어갔는지 판단하여 해당 동작을 수행
// --------------------------------

// 반응(이모지) 버튼 클릭 판정
function checkReactionButtons(xIndex, yIndex, currentTime) {
  for (let btn of reactionButtons) {
    if (xIndex > btn.x && xIndex < btn.x + btn.w &&
        yIndex > btn.y && yIndex < btn.y + btn.h) {
      if (!lastTriggerTime[btn.label] || currentTime - lastTriggerTime[btn.label] > cooldown) {
        triggerReaction(btn.label);
        lastTriggerTime[btn.label] = currentTime;
      }
    }
  }
}

// Clear 버튼(지우개) 클릭 판정: 손이 해당 영역에 들어가면 삭제 옵션을 활성화
function checkClearButton(xIndex, yIndex, currentTime) {
  let overClear = (xIndex > clearButton.x && xIndex < clearButton.x + clearButton.w &&
                   yIndex > clearButton.y && yIndex < clearButton.y + clearButton.h);
  if (overClear) {
    showDeleteOptions = true;
    if (deleteOptions.length === 0) {
      // Clear 버튼 아래에 "전체 삭제"와 "부분 삭제" 옵션 버튼 생성
      deleteOptions = [
        { label: "전체 삭제", x: clearButton.x, y: clearButton.y + clearButton.h + 10, w: clearButton.w, h: 40 },
        { label: "부분 삭제", x: clearButton.x, y: clearButton.y + clearButton.h + 60, w: clearButton.w, h: 40 }
      ];
    }
  }
}

// 팔레트 버튼 클릭 판정: 손이 해당 영역에 들어가면 색상 옵션을 표시
function checkColorButton(xIndex, yIndex, currentTime) {
  let overColor = (xIndex > colorButton.x && xIndex < colorButton.x + colorButton.w &&
                   yIndex > colorButton.y && yIndex < colorButton.y + colorButton.h);
  if (overColor) {
    showColorOptions = true; // 색상 옵션 창 표시
  }
}

// --------------------------------
// 이모지 버튼 클릭 시 애니메이션 생성 함수
// 각 이모지 버튼에 따라 다른 애니메이션 효과(하트, 엄지, 박수, 기본)를 생성
// --------------------------------
function triggerReaction(label) {
  if (label === "❤️") {
    // 하트 애니메이션: 여러 개가 화면 상단에서 랜덤한 x 좌표에서 떨어짐
    let count = 10;
    for (let i = 0; i < count; i++) {
      let reaction = {
        label: label,
        x: random(width),
        y: -random(20, 100),
        alpha: 255,
        speed: random(1, 3),
        type: "heart"
      };
      reactions.push(reaction);
    }
  } else if (label === "👍") {
    // 엄지 애니메이션: 화면 중앙에 더 큰 사이즈(텍스트 사이즈 100)의 엄지 이모티콘 표시
    let reaction = {
      label: label,
      x: width / 2,
      y: height / 2,
      alpha: 255,
      speed: random(1, 3),
      type: "thumb"
    };
    reactions.push(reaction);
  } else if (label === "👏") {
    // 박수 애니메이션: 여러 개의 박수 이모티콘이 화면 중앙 주변에서 나타남
    let count = 5;
    for (let i = 0; i < count; i++) {
      let reaction = {
        label: label,
        x: width / 2 + random(-50, 50),
        y: height / 2 + random(-50, 50),
        alpha: 255,
        speed: random(1, 3),
        type: "applause"
      };
      reactions.push(reaction);
    }
  } else {
    // 기본 애니메이션 (예: "👎")
    let reaction = {
      label: label,
      x: width / 2,
      y: height / 2,
      alpha: 255,
      speed: random(1, 3),
      type: "default"
    };
    reactions.push(reaction);
  }
}

// --------------------------------
// 이모지 애니메이션 업데이트 및 그리기 함수
// 각 애니메이션 객체의 위치와 투명도(alpha)를 업데이트하고, 화면에 그린 후, alpha가 0 이하이면 배열에서 제거
// --------------------------------
function updateReactions() {
  for (let i = reactions.length - 1; i >= 0; i--) {
    let r = reactions[i];
    // 기본 텍스트 사이즈 64, 타입에 따라 조정 (엄지는 100)
    let ts = 64;
    if (r.type === "thumb") {
      ts = 100;
    }
    fill(0, 0, 0, r.alpha);
    textSize(ts);
    textAlign(CENTER, CENTER);
    text(r.label, r.x, r.y);

    // 애니메이션 이동: 하트는 아래로, 그 외(엄지, 박수 등)는 위로 이동
    if (r.type === "heart") {
      r.y += r.speed;
    } else {
      r.y -= r.speed;
    }
    // 알파(투명도) 서서히 감소 -> 하트의 경우 더 천천히 감소시켜 오래 남게 함
    r.alpha -= 1;
    if (r.alpha <= 0) {
      reactions.splice(i, 1);
    }
  }
}

// --------------------------------
// 칠판 지우기 함수 (전체 삭제)
// --------------------------------
function clearBoard() {
  board.clear();
}
