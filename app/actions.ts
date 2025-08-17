'use server';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export async function signup(data: Record<string, any>) {
  const { name, email, password, confirmPassword } = data;

  if (!name || !email || !password || !confirmPassword) {
    return { error: 'All fields are required.' };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: 'User with this email already exists.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name,
        email,
        password: hashedPassword,
      },
    });
  } catch (error) {
    console.error(error);
    return { error: 'Could not create user. Please try again.' };
  }

  redirect('/sign-in');
}

export async function signin(data: Record<string, any>) {
  const { email, password } = data;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { error: 'Invalid email or password.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { error: 'Invalid email or password.' };
    }
  
    console.log("User successfully signed in.");

  } catch (error) {
    console.error(error);
    return { error: 'An error occurred. Please try again.' };
  }
  
  redirect('/dashboard');
}