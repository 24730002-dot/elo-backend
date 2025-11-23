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
   2) 강의 목록 파일 (마이페이지용 addCourse 저장)
=========================================================== */
const COURSES_FILE = "./courses.json";

async function loadCourses() {
  try {
    const data = await fs.readFile(COURSES_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveCourses(courses) {
  await fs.writeFile(COURSES_FILE, JSON.stringify(courses, null, 2));
}

/* ===========================================================
   3) 진행률 파일
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

async function saveProgress(progress) {
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

/* ===========================================================
   ⭐ 회원가입
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
   ⭐ 로그인
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
   ⭐ 강의 추가 API (나의 강의실 등록)
=========================================================== */
app.post("/addCourse", async (req, res) => {
  const { user, title, link } = req.body;

  if (!user || !title || !link) {
    return res.json({ success: false, message: "필수 데이터 누락" });
  }

  let courses = await loadCourses();

  if (!courses[user]) courses[user] = [];

  // 중복방지
  if (courses[user].some(c => c.title === title)) {
    return res.json({ success: false, message: "이미 추가된 강의입니다" });
  }

  courses[user].push({
    title,
    link,
    progress: 0
  });

  await saveCourses(courses);

  res.json({ success: true, message: "강의 추가 완료" });
});

/* ===========================================================
   ⭐ 진행률 업데이트
=========================================================== */
app.post("/progress/update", async (req, res) => {
  const { userId, title, progress } = req.body;

  if (!userId || !title || typeof progress !== "number") {
    return res.json({ success: false, message: "필수 데이터 누락" });
  }

  let courses = await loadCourses();

  if (!courses[userId]) courses[userId] = [];

  const idx = courses[userId].findIndex(c => c.title === title);

  if (idx < 0) {
    return res.json({ success: false, message: "등록되지 않은 강의" });
  }

  courses[userId][idx].progress = progress;

  await saveCourses(courses);

  res.json({ success: true, message: "진행률 업데이트 완료" });
});

/* ===========================================================
   ⭐ 나의 강의실 조회
=========================================================== */
app.get("/progress/list", async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.json({ success: false, message: "userId 누락" });
  }

  let courses = await loadCourses();

  return res.json({
    success: true,
    courses: courses[userId] || []
  });
});

/* ===========================================================
   서버 시작
=========================================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
