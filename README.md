# Leepu 포트폴리오 사이트

주소: https://lee-pu.github.io/ · 관리: https://lee-pu.github.io/admin.html

GitHub Pages에 올리는 사이트입니다. 방문자에게는 **홈**(`index.html`), **Works**(`works.html`), **Items**(`items.html`) 세 페이지가 보이고, 나는 **관리 화면**(`/admin.html`)에서 등록·수정·설정을 합니다. 예전 주소(`/leepu/…`)로 들어오면 `404.html`이 새 주소로 옮겨 줘요.

```
index.html                  공개 사이트
admin.html                  관리 화면 (작업물 · 아이템 · 설정)
data.json                   사이트 내용 전부 (관리 화면이 알아서 고침)
assets/img, assets/video    사진과 영상
.github/workflows/site.yml  저장할 때마다 BOOTH 정보 채우기 + 사이트 배포
tools/파일 가져오기.bat      Base44 사진·영상 내려받기 (처음 한 번)
tools/booth_fill.py         BOOTH 정보 채우기 (GitHub가 자동 실행)
```

## 1. Base44 파일 내려받기 (Base44 앱 지우기 전에 꼭)

`data.json`의 사진·영상 주소가 아직 Base44 서버를 가리켜요.

1. Python이 없다면 python.org에서 설치 (설치 화면에서 **Add python.exe to PATH** 체크)
2. `tools/파일 가져오기.bat` 더블클릭
3. 끝나면 용량 합계가 나와요. 95MB 넘는 영상이 있으면 목록이 나오는데, 그 영상은 YouTube에 올리고 나중에 관리 화면에서 YouTube 주소로 바꿔 주세요

## 2. GitHub에 올리기

1. GitHub에서 새 저장소 만들기. 이름을 `아이디.github.io`로 하면 주소가 `https://아이디.github.io`가 돼요 (Public으로)
2. 폴더 안의 내용을 전부 올리기. **GitHub Desktop**을 쓰는 게 가장 편해요 (`.github` 폴더처럼 점으로 시작하는 폴더도 같이 올라가야 해요)
   - 웹에서 올릴 때는 한 번에 100개 파일까지라 `assets/img`를 나눠 올려야 하고, `.github` 폴더가 안 보이면 탐색기에서 **숨긴 항목 표시**를 켜 주세요
3. 저장소 **Settings → Pages → Source**를 **GitHub Actions**로 바꾸기
4. **Actions** 탭에서 "사이트 배포"가 초록색 체크가 되면 주소로 접속 (처음엔 2~3분)

## 3. 관리 화면 쓰기

`https://아이디.github.io/admin.html` 을 열고 처음 한 번만 GitHub 토큰을 넣어요. 만드는 법은 화면에 나와 있고, 요약하면:

1. https://github.com/settings/personal-access-tokens/new
2. **Repository access** → **Only select repositories** → 사이트 저장소만
3. **Repository permissions → Contents** → **Read and write**
4. **Generate token** → 복사해서 관리 화면에 붙여넣기

토큰은 그 브라우저에만 저장돼요. 다른 컴퓨터나 폰에서 관리하려면 거기서도 한 번 넣으면 되고, 만료되면 새로 만들어 넣으면 돼요.

**작업물 탭**: 등록 버튼 → 제목·카테고리·날짜·설명, YouTube 주소, 썸네일·이미지 파일 → 등록. 사진은 자동으로 웹용 크기로 줄여서 올라가요. "사이트에 보이기"를 끄면 비공개.

**아이템 탭**: BOOTH 상품 링크만 넣고 등록하면 1분쯤 뒤 이름·썸네일이 자동으로 채워지고, 카테고리·아바타도 비워 두면 상품 정보를 보고 추측해서 채워요. 직접 입력한 칸은 건드리지 않아요. 채워지는 동안은 공개 사이트에 안 보여요. 방송 가능 여부는 직접 체크해 주세요.

**설정 탭**: 이름, 자기소개, 프로필 이미지, 이메일, 링크, 사용 툴, 포인트 색, 아이템 안내 문구.

저장하면 1~2분 뒤 사이트에 반영돼요. 진행 상황은 저장소 **Actions** 탭에서 볼 수 있어요.

## GitHub에 올리기 전에 편집하기

`Leepu-관리.html` (따로 받은 파일)을 더블클릭하면 GitHub 없이 바로 관리 화면이 열려요. 작업물·아이템·설정을 고치고, 아이템은 체크해서 여러 개를 한번에 지울 수 있어요. 다 고친 뒤 위쪽 **data.json 저장**을 눌러 받은 파일로 이 폴더의 `data.json`을 바꾸고, `파일 가져오기.bat`을 한 번 실행하면 그 사이 올린 사진도 `assets` 폴더로 꺼내져요. 바꾼 내용은 브라우저에도 임시 저장되지만, 창을 닫기 전에 꼭 data.json 저장을 눌러 주세요.

## YouTube 영상

컴퓨터에서 바로 연 파일에서는 YouTube가 재생을 막아서(오류 153) 썸네일과 "YouTube에서 보기" 버튼이 대신 나와요. GitHub에 올린 사이트에서는 그대로 재생돼요.

## 알아 둘 것

- BOOTH 자동 채우기는 BOOTH 공식 기능이 아니라 상품 페이지를 읽는 방식이에요. BOOTH가 페이지를 바꾸거나 막으면 "자동 채우기 실패 · 직접 입력"으로 표시되니, 그때는 수정에서 이름과 썸네일을 직접 넣어 주세요
- 관리 화면에서 영상 파일은 50MB까지 올릴 수 있어요. 그보다 크면 YouTube 주소로
- 삭제해도 올렸던 사진 파일은 저장소에 남아요 (사이트에는 안 보임)
- `index.html`을 컴퓨터에서 바로 더블클릭하면 빈 화면이 나와요. 올린 주소로 확인하세요
