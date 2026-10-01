import { getServices } from "../src/services/container";

async function run() {
  console.log("=== Testing Username & Password Authentication ===");
  const services = getServices();

  // Test 1: Login with existing user by username
  console.log("Test 1: Login with username 'john'...");
  const loginRes = await services.auth.login("john", "1234");
  console.log("Login result:", {
    success: loginRes.success,
    username: loginRes.user?.username,
    role: loginRes.user?.role,
    name: loginRes.user?.name,
  });
  if (!loginRes.success || loginRes.user?.username !== "john") {
    throw new Error("Failed to login with username 'john'");
  }

  // Test 2: Login with manager by username
  console.log("Test 2: Login with username 'manager'...");
  const mgrRes = await services.auth.login("manager", "1234");
  console.log("Manager login:", {
    success: mgrRes.success,
    username: mgrRes.user?.username,
    role: mgrRes.user?.role,
  });
  if (!mgrRes.success || mgrRes.user?.username !== "manager") {
    throw new Error("Failed to login with username 'manager'");
  }

  // Test 3: Register a new user with username
  const testUsername = `user_${Date.now()}`;
  console.log(`Test 3: Register new employee with username '${testUsername}'...`);
  const regRes = await services.auth.register({
    name: "พนักงานทดสอบ ระบบใหม่",
    username: testUsername,
    password: "password123",
    role: "employee",
  });
  console.log("Register result:", {
    success: regRes.success,
    username: regRes.user?.username,
    id: regRes.user?.id,
  });
  if (!regRes.success || regRes.user?.username !== testUsername) {
    throw new Error("Failed to register employee with username");
  }

  // Test 4: Duplicate username prevention
  console.log("Test 4: Attempt duplicate registration with same username...");
  const dupRes = await services.auth.register({
    name: "คนชื่อซ้ำ",
    username: testUsername.toUpperCase(), // Case insensitive check
    password: "password123",
    role: "employee",
  });
  console.log("Duplicate register result:", {
    success: dupRes.success,
    error: dupRes.error,
  });
  if (dupRes.success) {
    throw new Error("Duplicate username was allowed, expected failure!");
  }

  // Test 5: Login with newly created username
  console.log("Test 5: Login with newly created username...");
  const newLoginRes = await services.auth.login(testUsername, "password123");
  console.log("New user login result:", {
    success: newLoginRes.success,
    username: newLoginRes.user?.username,
  });
  if (!newLoginRes.success) {
    throw new Error("Failed to login with newly registered username");
  }

  console.log("=== All Username Auth Tests Passed Successfully! ===");
  process.exit(0);
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
