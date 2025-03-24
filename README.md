# Hand Gesture Interactive Reactions (p5.js + ml5.js)

**[Youtube Link] : https://www.youtube.com/watch?v=Zo_0kY2xoNE**

## 프로젝트
[임베디드통신시스템 - 제스쳐와 화면 송출] 과제로, **p5.js**와 **ml5.js**(handPose 모델)를 활용해 웹캠을 통한 **핸드 제스처 인식**을 구현하고,  
이를 기반으로 **인터랙티브 리액션(이모지 버튼, 그림 그리기, 부분 삭제, 색상 선택 등)** 기능을 제공하는 예시입니다.  

## 과제 설명
1. **4개 이상의 반응 버튼 혹은 반응 동작**  
   - “👍” / “👎” / “❤️” / “👏” 버튼 클릭 시 애니메이션 발생  
2. **칠판처럼 글자/그림을 작성**  
   - 엄지~검지 간격(핀치)으로 드로잉  
3. **작성한 글자/그림을 지울 수 있음**  
   - 전체 삭제 (Clear 버튼)  
   - 부분 삭제 (부분 삭제 모드 + 핀치로 원하는 부분만 지우기)  
4. **가상 카메라(OBS 등)를 통해 카메라 디바이스로 인지**  
5. **생성한 Virtual Camera를 Zoom에서 동작**시켜 활용

---

## 실행 예시

**버튼 클릭 시 제스쳐는 오른손 검지 손가락만 피고, 나머지 손가락은 접은 제스쳐 (☝️)를 사용합니다.**

| 실행 반응           | 손 위치와 동작                                                    |
| ------------------- | ----------------------------------------------------------------- |
| **엄지 척**       | 오른손 검지를 화면에 `👍` 버튼에 가져다대면 커다란 엄지 이모티콘 등장 |
| **박수**       | 오른손 검지를 화면에 `👏` 버튼에 가져다대면 박수 이모티콘 여러 개 등장 |
| **하트**     | 오른손 검지를 ❤️ 버튼(`❤️`)에 가져다대면 하트가 쏟아져 나옴       |
| **우우~**     | 오른손 검지를 👎 버튼(`👎`)에 가져다대면 이모티콘이 나옴       |
| **색상 바꾸기**     | 오른손 검지를 팔레트 버튼(`🎨`)에 가져다대면 색상 팔레트가 열림       |
| **색상 바꾸기**     | 오른손 검지를 원하는 색상 사각형에 가져다대면 이후 그림 색상이 변경   |
| **그림 그리기**     | 엄지와 검지 간격을 좁혀(핀치)서 움직이면 해당 색상으로 그림을 그릴 수 있음 |
| **부분 삭제**       | 부분 삭제 모드 선택 후, 엄지와 검지로 특정 부분을 지울 수 있음       |
| **전체 삭제**       | Clear(🧽) 버튼 → "전체 삭제" 버튼을 누르면 화면 전체가 삭제됨        |
| **Virtual Camera**  | ManyCam 등의 프로그램에서 브라우저 캡처 → Zoom 등에서 ManyCam Virtual Camera를 선택해 활용 |

---

## 소프트웨어
- **p5.js**  
  - 웹캠 비디오 캡처 및 드로잉 처리
- **ml5.js**  
  - `handPose` 모델을 통해 손 관절(엄지, 검지 등) 추적
- **ManyCam 등**  
  - 가상 카메라를 통해 p5.js 스케치를 화상회의 툴(Zoom 등)에서 사용 가능

---

## 코드 설명
- **handPose.detectStart(video, gotHands)**: 웹캠 영상으로부터 매 프레임마다 손 관절을 인식해 `gotHands()` 콜백을 통해 결과를 갱신  
- **핀치 제스처**: 엄지와 검지 사이 거리가 `PINCH_THRESHOLD` 미만이면 드로잉 or 부분 삭제  
- **부분 삭제 모드**: Clear 버튼 하위 옵션 중 “부분 삭제”를 누르면 활성화, 이후 핀치로 특정 영역을 지울 수 있음  
- **색상 팔레트**: 팔레트 이모티콘(`🎨`) 클릭 시 10가지 색상(2×5) 표시, 손가락을 가져다대면 해당 색상으로 `currentColor` 변경  
- **반응 버튼(이모지)**: “👍” / “👎” / “❤️” / “👏” 클릭 시 각각 다른 애니메이션 효과 발생  
- **쿨다운**: 동일 버튼 연속 클릭을 방지하기 위해 `cooldown`(1초) 사용  
- **오프스크린 그래픽스(board)**: 드로잉과 삭제를 위한 별도 그래픽스 객체, 최종적으로 `image(board, 0, 0)`로 화면에 표시
- **상세 설명은 코드 주석 참고**

---
