import { ComponentProps } from 'react';
import { cn } from '../utils';

export const HomePage = ({ postId }: { postId: string }) => {

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-slate-900">
      <div className="pointer-events-none absolute inset-0 z-20 h-full w-full bg-slate-900 [mask-image:radial-gradient(transparent,white)]" />

      <h1 className={cn('relative z-20 text-xl text-white md:text-4xl')}>Welcome to Devvit</h1>
      <p className="relative z-20 mb-4 mt-2 text-center text-neutral-300">
        Let's build something awesome!
      </p>
      <img src="/assets/default-snoovatar.png" alt="default snoovatar picture" />
      <p className="relative z-20 mb-4 mt-2 text-center text-neutral-300">PostId: {postId}</p>
      <MagicButton
        onClick={() => {
        }}
      >
        Show me more
      </MagicButton>
    </div>
  );
};

const MagicButton = ({ children, ...props }: ComponentProps<'button'>) => {
  return (
    <button
      className={cn(
        'relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50',
        props.className
      )}
      {...props}
    >
      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
        {children}
      </span>
    </button>
  );
};
