import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

const AUTH_STORAGE_KEY = 'deeptrace-authenticated';
const AUTH_SESSION_KEY = 'deeptrace-authenticated-session';

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

type ForgotStep = 'email' | 'success';

export default function LoginPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // 忘记密码流程
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [forgotCodeSent, setForgotCodeSent] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 0 && password.trim().length > 0 && !isSubmitting, [
    email,
    isSubmitting,
    password,
  ]);

  // 验证码倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // 粒子动画
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

    const mouse = {
      x: -1000,
      y: -1000,
      radius: 120,
    };

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
          if (particle.x !== particle.baseX) {
            const moveX = particle.x - particle.baseX;
            particle.x -= moveX / 50;
          }
          if (particle.y !== particle.baseY) {
            const moveY = particle.y - particle.baseY;
            particle.y -= moveY / 50;
          }
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

    const resetMouse = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

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

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 1200);
    });

    if (rememberMe) {
      localStorage.setItem(AUTH_STORAGE_KEY, '1');
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    } else {
      sessionStorage.setItem(AUTH_SESSION_KEY, '1');
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    setIsSubmitting(false);
    setShowToast(true);

    window.setTimeout(() => {
      setShowToast(false);
      navigate('/chat/new', { replace: true });
    }, 900);
  };

  // 忘记密码：发送验证码
  const handleSendForgotCode = async () => {
    if (!forgotEmail.trim() || countdown > 0) return;
    setIsSubmitting(true);
    await new Promise((r) => window.setTimeout(r, 1000));
    setIsSubmitting(false);
    setForgotCodeSent(true);
    setCountdown(60);
  };

  // 忘记密码：提交
  const handleForgotNext = async () => {
    if (forgotStep === 'email') {
      if (
        !forgotEmail.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail) ||
        !forgotCode.trim() ||
        forgotCode.length < 6 ||
        !newPassword.trim() ||
        newPassword.length < 6 ||
        newPassword !== confirmPassword
      ) return;
      setForgotStep('success');
    }
  };

  // 忘记密码：返回登录
  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setForgotStep('email');
    setForgotEmail('');
    setForgotCode('');
    setNewPassword('');
    setConfirmPassword('');
    setCountdown(0);
    setForgotCodeSent(false);
  };

  return (
    <div ref={containerRef} className="relative h-screen w-full overflow-hidden bg-bgLight text-primaryText">
      <div className="absolute inset-0 z-0">
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[80vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(52,168,83,0.06)_0%,rgba(255,255,255,0)_70%)]" />
      <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] z-[1] h-[60vh] w-[60vw] bg-[radial-gradient(circle,rgba(15,157,88,0.05)_0%,rgba(255,255,255,0)_60%)]" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-md items-center justify-center px-4">
        <div className="w-full rounded-3xl border border-white/90 bg-surface/70 p-10 shadow-[0_20px_40px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.02)] backdrop-blur-[20px]">
          <div className="mb-10 text-center">
            <h1 className="bg-[linear-gradient(135deg,#202124_0%,#5f6368_100%)] bg-clip-text text-4xl font-semibold tracking-[-0.02em] text-transparent">
              DepTrace
            </h1>
            <p className="mt-2 text-sm text-gray-500">欢迎回来，请登录以进入科研工作台。</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <label className="relative block">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder=" "
                autoComplete="off"
                className="peer h-14 w-full rounded-xl border border-black/10 bg-surface px-5 py-4 text-base leading-none text-primaryText shadow-sm outline-none transition-all focus:border-success focus:ring-4 focus:ring-success/10"
              />
              <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-base text-tertiaryText transition-all peer-focus:left-4 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:rounded peer-focus:bg-surface peer-focus:px-1.5 peer-focus:text-xs peer-focus:font-medium peer-focus:text-success peer-[&:not(:placeholder-shown)]:left-4 peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:rounded peer-[&:not(:placeholder-shown)]:bg-surface peer-[&:not(:placeholder-shown)]:px-1.5 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:font-medium peer-[&:not(:placeholder-shown)]:text-success">
                 邮箱

              </span>
            </label>

            <label className="relative block">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder=" "
                className="peer h-14 w-full rounded-xl border border-black/10 bg-surface px-5 py-4 text-base leading-none text-primaryText shadow-sm outline-none transition-all focus:border-success focus:ring-4 focus:ring-success/10"
              />
              <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-base text-tertiaryText transition-all peer-focus:left-4 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:rounded peer-focus:bg-surface peer-focus:px-1.5 peer-focus:text-xs peer-focus:font-medium peer-focus:text-success peer-[&:not(:placeholder-shown)]:left-4 peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:rounded peer-[&:not(:placeholder-shown)]:bg-surface peer-[&:not(:placeholder-shown)]:px-1.5 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:font-medium peer-[&:not(:placeholder-shown)]:text-success">
                 密码

              </span>
            </label>

            <div className="flex items-center justify-between px-1">
              <label className="group inline-flex cursor-pointer items-center gap-2">
                <span className="relative inline-flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-surface shadow-sm transition-colors group-hover:border-green-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="peer absolute inset-0 cursor-pointer opacity-0"
                  />
                  <svg
                    className="h-3 w-3 text-green-500 opacity-0 transition-opacity peer-checked:opacity-100"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-sm text-gray-600 transition-colors group-hover:text-gray-900">记住我</span>
              </label>
              <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm font-medium text-[#5f6368] transition-colors hover:text-success">
                 忘记密码？

              </button>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-2 inline-flex h-14 w-full items-center justify-center rounded-xl bg-success text-base font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              <span>{isSubmitting ? '认证中...' : '登录'}</span>
              {isSubmitting && (
                <svg
                  className="ml-2 h-5 w-5 animate-spin text-white"
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

          {!showForgotPassword && (
            <p className="mt-6 text-center text-sm text-gray-500">
              首次使用平台？
              <button type="button" onClick={() => navigate('/register')} className="ml-1 font-medium text-green-500 transition-colors hover:text-green-600">
                去注册
              </button>
            </p>
          )}

          {/* 忘记密码流程 */}
          {showForgotPassword && (
            <div className="space-y-6">
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-sm font-medium text-[#5f6368] transition-colors hover:text-success"
                >
                  ← 返回登录
                </button>
              </div>

              {forgotStep === 'email' && (
                <div className="space-y-5">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-primaryText">重置密码</h2>
                    <p className="mt-1 text-sm text-gray-500">输入邮箱并验证后，重新设置密码</p>
                  </div>

                  <label className="relative block">
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder=" "
                      autoComplete="off"
                      className="peer h-14 w-full rounded-xl border border-black/10 bg-surface px-5 py-4 text-base leading-none text-primaryText shadow-sm outline-none transition-all focus:border-success focus:ring-4 focus:ring-success/10"
                    />
                    <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-base text-tertiaryText transition-all peer-focus:left-4 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:rounded peer-focus:bg-surface peer-focus:px-1.5 peer-focus:text-xs peer-focus:font-medium peer-focus:text-success peer-[&:not(:placeholder-shown)]:left-4 peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:rounded peer-[&:not(:placeholder-shown)]:bg-surface peer-[&:not(:placeholder-shown)]:px-1.5 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:font-medium peer-[&:not(:placeholder-shown)]:text-success">
                      邮箱
                    </span>
                  </label>

                  <div className="flex gap-3">
                    <label className="relative block flex-1">
                      <input
                        type="text"
                        value={forgotCode}
                        onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder=" "
                        autoComplete="off"
                        maxLength={6}
                        className="peer h-14 w-full rounded-xl border border-black/10 bg-surface px-5 py-4 text-base leading-none text-primaryText shadow-sm outline-none transition-all focus:border-success focus:ring-4 focus:ring-success/10"
                      />
                      <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-base text-tertiaryText transition-all peer-focus:left-4 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:rounded peer-focus:bg-surface peer-focus:px-1.5 peer-focus:text-xs peer-focus:font-medium peer-focus:text-success peer-[&:not(:placeholder-shown)]:left-4 peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:rounded peer-[&:not(:placeholder-shown)]:bg-surface peer-[&:not(:placeholder-shown)]:px-1.5 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:font-medium peer-[&:not(:placeholder-shown)]:text-success">
                        验证码
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSendForgotCode}
                      disabled={countdown > 0 || isSubmitting || !forgotEmail.trim()}
                      className={`h-14 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                        countdown > 0
                          ? 'border border-black/10 bg-surface text-gray-400 cursor-not-allowed'
                          : 'border border-black/10 bg-surface text-gray-600'
                      }`}
                    >
                      {countdown > 0 ? `${countdown}s后获取` : '获取验证码'}
                    </button>
                  </div>

                  <label className="relative block">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder=" "
                      className="peer h-14 w-full rounded-xl border border-black/10 bg-surface px-5 py-4 text-base leading-none text-primaryText shadow-sm outline-none transition-all focus:border-success focus:ring-4 focus:ring-success/10"
                    />
                    <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-base text-tertiaryText transition-all peer-focus:left-4 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:rounded peer-focus:bg-surface peer-focus:px-1.5 peer-focus:text-xs peer-focus:font-medium peer-focus:text-success peer-[&:not(:placeholder-shown)]:left-4 peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:rounded peer-[&:not(:placeholder-shown)]:bg-surface peer-[&:not(:placeholder-shown)]:px-1.5 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:font-medium peer-[&:not(:placeholder-shown)]:text-success">
                      新密码
                    </span>
                  </label>

                  <label className="relative block">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder=" "
                      className={`peer h-14 w-full rounded-xl border border-black/10 bg-surface px-5 py-4 text-base leading-none text-primaryText shadow-sm outline-none transition-all focus:border-success focus:ring-4 focus:ring-success/10 ${
                        confirmPassword.length > 0 && newPassword !== confirmPassword
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
                          : ''
                      }`}
                    />
                    <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-base text-tertiaryText transition-all peer-focus:left-4 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:rounded peer-focus:bg-surface peer-focus:px-1.5 peer-focus:text-xs peer-focus:font-medium peer-focus:text-success peer-[&:not(:placeholder-shown)]:left-4 peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:rounded peer-[&:not(:placeholder-shown)]:bg-surface peer-[&:not(:placeholder-shown)]:px-1.5 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:font-medium peer-[&:not(:placeholder-shown)]:text-success">
                      确认密码
                    </span>
                  </label>
                  {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <span className="block text-xs text-red-500">两次输入的密码不一致</span>
                  )}

                  <button
                    type="button"
                    onClick={handleForgotNext}
                    disabled={!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail) || !forgotCode.trim() || forgotCode.length < 6 || !newPassword.trim() || newPassword.length < 6 || newPassword !== confirmPassword}
                    className="mt-2 inline-flex h-14 w-full items-center justify-center rounded-xl bg-success text-base font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    重置密码
                  </button>
                </div>
              )}

              {forgotStep === 'success' && (
                <div className="flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-green-100/50" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                      <CheckCircle2 size={40} className="text-success" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-primaryText">密码重置成功</h3>
                    <p className="mt-2 text-sm text-gray-500">请使用新密码登录</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="mt-4 inline-flex h-14 w-full items-center justify-center rounded-xl bg-success text-base font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    返回登录
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className={`pointer-events-none fixed left-1/2 top-5 z-50 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-gray-100 bg-surface/90 px-6 py-3 text-sm font-medium text-gray-800 shadow-xl backdrop-blur-md transition-opacity duration-300 ${
          showToast ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <CheckCircle2 size={18} className="text-green-500" />
        <span>认证成功，正在进入工作台...</span>
      </div>
    </div>
  );
}
