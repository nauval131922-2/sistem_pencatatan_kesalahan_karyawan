import db from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function fixLogin() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    
    console.log("Generated new hash:", hash);

    await db.execute({
      sql: 'UPDATE users SET password = ? WHERE username = ?',
      args: [hash, 'admin']
    });

    console.log("Database updated successfully.");
    
    // Test it again
    const isMatch = await bcrypt.compare('admin123', hash);
    console.log("Sanity check - Password match:", isMatch);

  } catch (error) {
    console.error("Test error:", error);
  }
}

fixLogin();
