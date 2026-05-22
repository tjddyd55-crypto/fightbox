import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthError } from './auth.types';
import { AuthApiError } from './authApiClient';
import { useAuth } from './AuthContext';
import './auth.css';

const DEV_ACCOUNTS_HINT = [
  { loginId: 'superadmin', password: '123456!!', label: '슈퍼관리자' },
  { loginId: 'gymadmin', password: '123456!!', label: '체육관관리자' },
  { loginId: 'gymstaff', password: '123456!!', label: '체육관직원' },
  { loginId: 'creator', password: '123456!!', label: '운동영상 크리에이터' },
] as const;

export function LoginPage() {
  const { isAuthenticated, loading, login } = useAuth();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p className="auth-brand-subtitle">세션 확인 중…</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/workout-program-builder" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login(loginId, password);
      navigate('/workout-program-builder', { replace: true });
    } catch (error) {
      if (error instanceof AuthError) {
        setErrorMessage(error.message);
      } else if (error instanceof AuthApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('로그인에 실패했습니다. 다시 시도해 주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1 className="auth-brand-title">Fightbox</h1>
          <p className="auth-brand-subtitle">체육관 운동 프로그램 빌더</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-id">아이디</label>
            <input
              id="login-id"
              name="loginId"
              type="text"
              autoComplete="username"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">비밀번호</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? '로그인 중…' : '로그인'}
          </button>
        </form>

        <aside className="auth-dev-hint" aria-label="개발용 테스트 계정 안내">
          <h2>개발용 테스트 계정</h2>
          <ul>
            {DEV_ACCOUNTS_HINT.map((account) => (
              <li key={account.loginId}>
                {account.loginId} / {account.password} — {account.label}
              </li>
            ))}
          </ul>
          <p className="auth-dev-warning">
            개발/테스트 전용입니다. 운영 환경에서 이 비밀번호를 사용하지 마세요.
          </p>
        </aside>
      </div>
    </div>
  );
}
