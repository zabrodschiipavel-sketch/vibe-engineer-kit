const users = [];

export function register(name, email) {
  users.push({ name, email, createdAt: new Date() });
  return users.length - 1;
}

export function getUser(id) {
  return users[id];
}
