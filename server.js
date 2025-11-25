import express from "express";
import cors from "cors";
import fs from "fs-extra";

const app = express();
app.use(cors());
app.use(express.json());

/* ===========================================================
1) 회원 파일
=========================================================== */
const USERS_FILE = "./users.json";

async function loadUsers() {
try {
 const data = await fs.readFile(USERS_FILE, "utf8");
 return JSON.parse(data);
} catch {
return [];
 }
}

async function saveUsers(users) {
 await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

/* ===========================================================
2) 강의 진행률/등록 파일
=========================================================== */
const PROGRESS_FILE = "./progress.json";

async function loadProgress() {
 try {
 const data = await fs.readFile(PROGRESS_FILE, "utf8");
 return JSON.parse(data);
} catch {
return [];
}
}

async function saveProgress(list) {
await fs.writeFile(PROGRESS_FILE, JSON.stringify(list, null, 2));
}

/* ===========================================================
 3) 전체 강의 목록 파일 (모듈 정보 포함) - 새로 추가됨
=========================================================== */
const COURSES_FILE = "./courses.json"; // 이 파일에 모든 강의와 모듈 정보를 저장한다고 가정

async function loadCourses() {
 try {
const data = await fs.readFile(COURSES_FILE, "utf8");
 return JSON.parse(data);
} catch {
// 파일이 없거나 오류 발생 시 빈 배열 반환
 return [];
}
}

/* ===========================================================
 회원가입
=========================================================== */
app.post("/register", async (req, res) => {
const { id, pw } = req.body;

 if (!id || !pw) {
return res.json({ success: false, message: "필수 데이터 누락" });
 }

 let users = await loadUsers();
 if (users.find(u => u.id === id)) {
 return res.json({ success: false, message: "이미 존재하는 ID" });
}

users.push({ id, pw });
await saveUsers(users);

res.json({ success: true, message: "회원가입 성공" });
});

/* ===========================================================
 로그인
=========================================================== */
app.post("/login", async (req, res) => {
 const { id, pw } = req.body;

let users = await loadUsers();
 const user = users.find(u => u.id === id && u.pw === pw);

if (!user) {
 return res.json({ success: false, message: "로그인 실패" });
}

 res.json({ success: true, message: "로그인 성공" });
});

/* ===========================================================
 강의 추가 (나의 강의실 등록)
=========================================================== */
app.post("/addCourse", async (req, res) => {
const { userId, title, link } = req.body;
 if (!userId || !title || !link) {
return res.json({ success: false, message: "필수 데이터 누락" });
}

let list = await loadProgress();

 const exists = list.some(
 (c) => c.userId === userId && c.title === title
 );

if (exists) {
 return res.json({ success: false, message: "이미 추가한 강의입니다." });
}

list.push({
userId,
 title,
 link,
progress: 0,
});

 await saveProgress(list);

res.json({ success: true, message: "강의가 나의강의실에 추가되었습니다." });
});

/* ===========================================================
진행률 업데이트
=========================================================== */
app.post("/progress/update", async (req, res) => {
 const { userId, title, progress } = req.body;

 // ... (필수 데이터 누락 검사 생략) ...

 let list = await loadProgress();

 const idx = list.findIndex(
(c) => c.userId === userId && c.title === title
);

// ... (등록되지 않은 강의 검사 생략) ...

 list[idx].progress = progress;

// ⭐ [수정 핵심] 진도율이 100%가 되면 오늘 날짜를 저장
   if (progress >= 100 && !list[idx].completionDate) {
      const now = new Date();
      // YYYY. MM. DD 형식으로 저장
      const dateString = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, '0')}. ${String(now.getDate()).padStart(2, '0')}`;
      list[idx].completionDate = dateString;
   }

await saveProgress(list);

res.json({ success: true, message: "진행률 업데이트 완료" });
});

/* ===========================================================
나의 강의실 조회
=========================================================== */
app.get("/progress/list", async (req, res) => {
const userId = req.query.userId;

if (!userId) {
 return res.json({ success: false, message: "userId 누락" });
}

let list = await loadProgress();

return res.json({
success: true,
courses: list.filter((c) => c.userId === userId)
 });
});

// -----------------------------------------------------------------
// ⭐ print.html이 호출하는 엔드포인트: 강의 모듈 목록 조회 (추가됨)
// -----------------------------------------------------------------
app.get("/course/modules", async (req, res) => {
const title = req.query.title;

 if (!title) {
 // title이 없으면 JSON 형식으로 오류 응답
return res.json({ success: false, message: "강의 제목(title) 누락" });
 }

 let courses = await loadCourses();

 // 쿼리 파라미터로 받은 title과 일치하는 강의를 찾습니다.
 const course = courses.find((c) => c.title === title);

 if (!course) {
 // 강의를 찾지 못했으면 빈 배열을 포함하는 JSON 형식으로 응답
return res.json({ success: true, modules: [], message: "해당 강의를 찾을 수 없음" });
 }

// 성공 시, 해당 강의의 modules 목록을 반환 (JSON)
 return res.json({
 success: true,
 modules: course.modules, // courses.json 파일의 구조에 'modules' 배열이 있다고 가정
});
});


/* ===========================================================
 서버 시작
=========================================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));