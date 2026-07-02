import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

type Particle = {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  density: number;
  vx: number;
  vy: number;
};

const createParticle = (width: number, height: number): Particle => {
  const x = Math.random() * width;
  const y = Math.random() * height;
  return {
    x,
    y,
    baseX: x,
    baseY: y,
    size: Math.random() * 1.5 + 0.5,
    density: Math.random() * 30 + 1,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
  };
};

const baseConnectionColor = '80, 180, 120';

type ForgotPasswordStep = 'email' | 'success';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);

  // ---- 验证码倒计时 ----
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ---- 粒子动画 ----
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let rafId = 0;
    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;
    let particles: Particle[] = [];

    const mouse = { x: -1000, y: -1000, radius: 120 };
    const maxDistance = 150;

    const setCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = width < 768 ? 40 : 90;
      particles = Array.from({ length: count }, () => createParticle(width, height));
    };

    const drawParticle = (particle: Particle) => {
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.closePath();
      context.fill();
    };

    const animate = () => {
      context.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0 || particle.x > width) particle.vx = -particle.vx;
        if (particle.y < 0 || particle.y > height) particle.vy = -particle.vy;

        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        const force = (mouse.radius - distance) / mouse.radius;
        const directionX = forceDirectionX * force * particle.density;
        const directionY = forceDirectionY * force * particle.density;

        if (distance < mouse.radius) {
          particle.x -= directionX * 0.5;
          particle.y -= directionY * 0.5;
          context.fillStyle = 'rgba(52, 168, 83, 0.9)';
          particle.size = Math.min(particle.size + 0.1, 2.5);
        } else {
          if (particle.x !== particle.baseX) particle.x -= (particle.x - particle.baseX) / 50;
          if (particle.y !== particle.baseY) particle.y -= (particle.y - particle.baseY) / 50;
          context.fillStyle = 'rgba(80, 180, 120, 0.4)';
          particle.size = Math.max(particle.size - 0.05, 1);
        }

        drawParticle(particle);

        for (let j = i; j < particles.length; j += 1) {
          const next = particles[j];
          const linkDx = particle.x - next.x;
          const linkDy = particle.y - next.y;
          const linkDistance = Math.sqrt(linkDx * linkDx + linkDy * linkDy);
          if (linkDistance < maxDistance) {
            const opacity = (1 - linkDistance / maxDistance) * 0.4;
            context.beginPath();
            context.strokeStyle = `rgba(${baseConnectionColor}, ${opacity})`;
            context.lineWidth = 1;
            context.moveTo(particle.x, particle.y);
            context.lineTo(next.x, next.y);
            context.stroke();
            context.closePath();
          }
        }
      }
      rafId = window.requestAnimationFrame(animate);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    };
    const resetMouse = () => { mouse.x = -1000; mouse.y = -1000; };
    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length < 1) return;
      const rect = container.getBoundingClientRect();
      mouse.x = event.touches[0].clientX - rect.left;
      mouse.y = event.touches[0].clientY - rect.top;
    };

    setCanvasSize();
    animate();

    window.addEventListener('resize', setCanvasSize);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', resetMouse);
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', resetMouse);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', setCanvasSize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', resetMouse);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', resetMouse);
    };
  }, []);

  // ---- 发送验证码 ----
  const handleSendCode = async () => {
    if (!email.trim() || countdown > 0) return;
    setIsSubmitting(true);
    await new Promise((r) => window.setTimeout(r, 1000));
    setIsSubmitting(false);
    setCodeSent(true);
    setCountdown(60);
  };

  // ---- 步骤切换 ----
  const goNext = () => {
    const order: ForgotPasswordStep[] = ['email', 'verify', 'password', 'success'];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) setStep(order[idx + 1]);
  };

  // ---- 各步骤可提交判断 ----
  const canSubmitStep = useMemo(() => {
    switch (step) {
      case 'email':
        return (
          email.trim().length > 0 &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
          verifyCode.trim().length >= 6 &&
          password.trim().length >= 6 &&
          password === confirmPassword
        );
      case 'success':
        return false;
      default:
        return false;
    }
  }, [step, email, verifyCode, password, confirmPassword, isSubmitting]);

  // ---- 提交当前步骤 ----
  const handleSubmitStep = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmitStep) return;

    setIsSubmitting(true);
    await new Promise((r) => window.setTimeout(r, 800));
    setIsSubmitting(false);

    if (step === 'password') {
      // 密码重置完成，跳转到成功页
      goNext();
    } else {
      goNext();
    }
  };

  // ---- 步骤描述 ----
  const stepTitle: Record<ForgotPasswordStep, string> = {
    email: '重置您的密码',
    success: '',
  };
  const stepDesc: Record<ForgotPasswordStep, string> = {
    email: '',
    success: '',
  };

  // ---- 输入框通用样式 ----
  const inputClass =
    'peer h-14 w-full rounded-xl border border-black/10 bg-white px-5 py-4 text-base leading-none text-[#202124] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] outline-none transition-all focus:border-[#34a853] focus:ring-4 focus:ring-[#34a853]/10';
  const labelClass =
    'pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-base text-[#80868b] transition-all peer-focus:left-4 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:rounded peer-focus:bg-white peer-focus:px-1.5 peer-focus:text-xs peer-focus:font-medium peer-focus:text-[#34a853] peer-[&:not(:placeholder-shown)]:left-4 peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:rounded peer-[&:not(:placeholder-shown)]:bg-white peer-[&:not(:placeholder-shown)]:px-1.5 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:font-medium peer-[&:not(:placeholder-shown)]:text-[#34a853]';

  return (
    <div ref={containerRef} className="relative h-screen w-full overflow-hidden bg-[#f8fdf9] text-[#202124]">
      {/* 粒子背景 */}
      <div className="absolute inset-0 z-0">
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[80vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(52,168,83,0.06)_0%,rgba(255,255,255,0)_70%)]" />
      <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] z-[1] h-[60vh] w-[60vw] bg-[radial-gradient(circle,rgba(15,157,88,0.05)_0%,rgba(255,255,255,0)_60%)]" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-md items-center justify-center px-4">
        <div className="w-full rounded-3xl border border-white/90 bg-white/70 p-10 shadow-[0_20px_40px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.02)] backdrop-blur-[20px]">
          {/* 头部 */}
          <div className="mb-8 text-center">
            <h1 className="bg-[linear-gradient(135deg,#202124_0%,#5f6368_100%)] bg-clip-text text-4xl font-semibold tracking-[-0.02em] text-transparent">
              DepTrace
            </h1>
            <p className="mt-2 text-sm text-gray-500">重置您的登录密码。</p>
          </div>

          {/* 步骤标题与描述 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#202124]">{stepTitle[step]}</h2>
            {stepDesc[step] && <p className="mt-1 text-sm text-gray-500">{stepDesc[step]}</p>}
          </div>

          {/* 步骤表单 */}
          {step !== 'success' && (
            <form onSubmit={handleSubmitStep} className="space-y-5">
              {/* 邮箱+验证码+新密码 */}
              {step === 'email' && (
                <>
                  <label className="relative block">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder=" "
                      autoComplete="off"
                      className={inputClass}
                    />
                    <span className={labelClass}>邮箱</span>
                  </label>
                  <div className="flex gap-3">
                    <label className="relative block flex-1">
                      <input
                        type="text"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        placeholder=" "
                        autoComplete="off"
                        maxLength={6}
                        className={inputClass}
                      />
                      <span className={labelClass}>验证码</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={countdown > 0 || isSubmitting}
                      className={`h-14 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                        countdown > 0
                          ? 'border border-black/10 bg-white text-gray-400 cursor-not-allowed'
                          : 'border border-black/10 bg-white text-gray-600'
                      }`}
                    >
                      {countdown > 0 ? `${countdown}s后获取` : '获取验证码'}
                    </button>
                  </div>
                  <label className="relative block">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder=" "
                      className={inputClass}
                    />
                    <span className={labelClass}>新密码</span>
                  </label>
                  <label className="relative block">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder=" "
                      className={`${inputClass} ${
                        confirmPassword.length > 0 && password !== confirmPassword
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
                          : ''
                      }`}
                    />
                    <span className={labelClass}>确认新密码</span>
                    {confirmPassword.length > 0 && password !== confirmPassword && (
                      <span className="mt-1 block text-xs text-red-500">两次输入的密码不一致</span>
                    )}
                  </label>
                </>
              )}

              {/* 操作按钮 */}
              <button
                type="submit"
                disabled={!canSubmitStep}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#34a853_0%,#2b8c45_100%)] text-base font-semibold text-white shadow-[0_4px_14px_rgba(52,168,83,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(52,168,83,0.4)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 pt-2"
              >
                <span>{isSubmitting ? '处理中...' : '重置密码'}</span>
                {isSubmitting && (
                  <svg
                    className="h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4Zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647Z"
                    />
                  </svg>
                )}
              </button>
            </form>
          )}

          {/* 成功页 */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-green-100/50" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle2 size={40} className="text-[#34a853]" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-[#202124]">密码重置成功</h3>
                <p className="mt-2 text-sm text-gray-500">请用新密码登录</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.setTimeout(() => {
                    navigate('/login', { replace: true });
                  }, 1000);
                }}
                className="mt-4 inline-flex h-14 w-full items-center justify-center rounded-xl bg-[linear-gradient(135deg,#34a853_0%,#2b8c45_100%)] text-base font-semibold text-white shadow-[0_4px_14px_rgba(52,168,83,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(52,168,83,0.4)]"
              >
                返回登录
              </button>
            </div>
          )}

          {step !== 'success' && (
            <p className="mt-6 text-center text-sm text-gray-500">
              想起密码了？
              <button type="button" onClick={() => navigate('/login')} className="ml-1 font-medium text-green-500 transition-colors hover:text-green-600">
                返回登录
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
