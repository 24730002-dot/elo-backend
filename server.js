import express from "express";
import cors from "cors";
import fs from "fs-extra";

const app = express();
app.use(cors());
app.use(express.json());

// JSON 파일 경로
const USERS_FILE = "./users.json";

// 파일에서 유저 목록 불러오기
async function loadUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// 파일에 유저 목록 저장하기
async function saveUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// 회원가입 API
app.post("/register", async (req, res) => {
  const { id, pw } = req.body;

  if (!id || !pw) {
    return res.json({ success: false, message: "필수 데이터 누락" });
  }

  let users = await loadUsers();

  const exists = users.find(u => u.id === id);
  if (exists) {
    return res.json({ success: false, message: "이미 존재하는 ID" });
  }

  users.push({ id, pw });
  await saveUsers(users);

  return res.json({ success: true, message: "회원가입 성공" });
});

// 로그인 API
app.post("/login", async (req, res) => {
  const { id, pw } = req.body;

  let users = await loadUsers();

  const user = users.find(u => u.id === id && u.pw === pw);

  if (!user) {
    return res.json({ success: false, message: "로그인 실패" });
  }

  return res.json({ success: true, message: "로그인 성공" });
});

// 서버 실행
app.listen(3000, () => {
  console.log("Backend running on port 3000");
});

const PROGRESS_FILE = "./progress.json";

// 진행률 불러오기
async function loadProgress() {
  try {
    const data = await fs.readFile(PROGRESS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// 진행률 저장
async function saveProgress(progress) {
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

/* ================== 진행률 업데이트 API ================== */
// 예: POST /progress/update  { id, courseId, progress }
app.post("/progress/update", async (req, res) => {
  const { id, courseId, progress } = req.body;

  if (!id || !courseId || typeof progress !== "number") {
    return res.json({ success: false, message: "필수 데이터 누락" });
  }

  let list = await loadProgress();

  // 기존 데이터 있으면 수정, 없으면 추가
  const idx = list.findIndex(
    (p) => p.userId === id && p.courseId === courseId
  );

  if (idx >= 0) {
    list[idx].progress = progress;
  } else {
    list.push({ userId: id, courseId, progress });
  }

  await saveProgress(list);
  return res.json({ success: true, message: "진행률 업데이트 완료" });
});

/* ================== 나의 강의실용 조회 API ================== */
// 예: GET /progress/list?userId=xxx
app.get("/progress/list", async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.json({ success: false, message: "userId 누락" });
  }

  const list = await loadProgress();
  const myCourses = list.filter((p) => p.userId === userId);

  return res.json({ success: true, courses: myCourses });
});

app.post("/addCourse", (req, res) => {
  const { user, title, link, progress } = req.body;

  if (!db[user]) db[user] = [];

  // 중복 체크
  if (db[user].some(c => c.title === title)) {
    return res.json({ success: false, message: "Course already added!" });
  }

  db[user].push({ title, link, progress });

  res.json({ success: true });
});
