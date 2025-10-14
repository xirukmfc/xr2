from fastapi import Request, HTTPException, status
from fastapi.responses import RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import base64
from typing import Optional, Tuple
import secrets
import hashlib
from datetime import datetime, timedelta

from app.core.config import settings


class SwaggerAuthMiddleware(BaseHTTPMiddleware):
    """Middleware для защиты админского Swagger интерфейса"""
    
    def __init__(self, app, admin_path: str = "/admin-docs"):
        super().__init__(app)
        self.admin_path = admin_path
        # Простая сессия для хранения авторизованных пользователей
        self._sessions = {}
    
    def _check_admin_credentials(self, username: str, password: str) -> bool:
        """Проверка админских учетных данных"""
        return (
            username == settings.ADMIN_USERNAME and 
            password == settings.ADMIN_PASSWORD
        )
    
    def _create_session(self, username: str) -> str:
        """Создание сессии для авторизованного пользователя"""
        session_id = secrets.token_urlsafe(32)
        self._sessions[session_id] = {
            "username": username,
            "created_at": datetime.now(),
            "expires_at": datetime.now() + timedelta(hours=1)  # Сессия на 1 час
        }
        return session_id
    
    def _is_session_valid(self, session_id: str) -> bool:
        """Проверка валидности сессии"""
        # Простая проверка для админской сессии
        return session_id == "admin_authenticated"
    
    def _get_auth_from_header(self, request: Request) -> Optional[Tuple[str, str]]:
        """Извлечение username:password из заголовка Authorization"""
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Basic "):
            return None
        
        try:
            encoded_credentials = auth_header[6:]  # Убираем "Basic "
            decoded_credentials = base64.b64decode(encoded_credentials).decode("utf-8")
            username, password = decoded_credentials.split(":", 1)
            return username, password
        except Exception:
            return None
    
    def _get_session_from_cookie(self, request: Request) -> Optional[str]:
        """Извлечение session_id из cookie"""
        return request.cookies.get("swagger_session")
    
    def _create_login_page(self) -> str:
        """Создание HTML страницы для входа"""
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>xR2 Admin Swagger - Login</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                }
                .login-container {
                    background: white;
                    padding: 2rem;
                    border-radius: 10px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    width: 100%;
                    max-width: 400px;
                }
                .login-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }
                .login-header h1 {
                    color: #333;
                    margin: 0;
                    font-size: 1.5rem;
                }
                .login-header p {
                    color: #666;
                    margin: 0.5rem 0 0 0;
                    font-size: 0.9rem;
                }
                .form-group {
                    margin-bottom: 1rem;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: #333;
                    font-weight: 500;
                }
                .form-group input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 1rem;
                    box-sizing: border-box;
                }
                .form-group input:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
                }
                .login-button {
                    width: 100%;
                    padding: 0.75rem;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .login-button:hover {
                    background: #5a6fd8;
                }
                .error-message {
                    color: #e74c3c;
                    text-align: center;
                    margin-top: 1rem;
                    font-size: 0.9rem;
                }
            </style>
        </head>
        <body>
            <div class="login-container">
                <div class="login-header">
                    <h1>🔐 xR2 Admin Swagger</h1>
                </div>
                <form method="post" action="/admin-docs/login">
                    <div class="form-group">
                        <label for="username">Username:</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password:</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <button type="submit" class="login-button">Войти</button>
                </form>
            </div>
        </body>
        </html>
        """
    
    async def dispatch(self, request: Request, call_next):
        """Основная логика middleware"""
        
        # Проверяем, является ли запрос к админскому Swagger
        if request.url.path.startswith(self.admin_path):
            
            # Исключаем endpoint логина из проверки
            if request.url.path == f"{self.admin_path}/login":
                response = await call_next(request)
                return response
            
            # Проверяем сессию для всех остальных запросов
            session_id = self._get_session_from_cookie(request)
            if not session_id or not self._is_session_valid(session_id):
                # Показываем страницу входа
                if request.url.path == self.admin_path or request.url.path == f"{self.admin_path}/":
                    return Response(
                        content=self._create_login_page(),
                        media_type="text/html"
                    )
                else:
                    # Перенаправляем на страницу входа
                    return RedirectResponse(url=self.admin_path, status_code=302)
        
        # Для всех остальных запросов продолжаем обычную обработку
        response = await call_next(request)
        return response
