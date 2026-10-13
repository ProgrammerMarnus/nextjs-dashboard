import SignupForm from '@/app/ui/signup-form';
import { Suspense } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
};

export default function SignupPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="w-full max-w-[400px] p-4">
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </main>
  );
}