let locked = false;

export async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  while (locked) {
    await new Promise(res => setTimeout(res, 5));
  }

  locked = true;
  try {
    return await fn();
  } finally {
    locked = false;
  }
}
