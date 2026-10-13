import LoginForm from '@/app/ui/login-form';
import { Suspense } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
};

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="w-full max-w-[400px] p-4">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}