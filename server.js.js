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
