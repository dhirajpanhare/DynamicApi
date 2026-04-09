using System;
using System.Net;
using System.Net.Http;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DynamicApi.Services
{
    public interface IEmailService
    {
        Task<EmailServiceResult> SendOtpEmailAsync(string email, string otp, int expiryMinutes);
    }

    public class EmailServiceResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string Code { get; set; }
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly HttpClient _httpClient;
        private readonly string _emailProvider;
        private readonly string _senderEmail;

        public EmailService(
            IConfiguration configuration,
            HttpClient httpClient,
            ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _httpClient = httpClient;
            _logger = logger;
            _emailProvider = configuration["Email:Provider"] ?? "console";
            _senderEmail = configuration["Email:SenderEmail"] ?? "dhirajpanhare08@gmail.com";

            _logger.LogInformation($"[EMAIL] EmailService initialized with provider: {_emailProvider}");
        }

        public async Task<EmailServiceResult> SendOtpEmailAsync(string email, string otp, int expiryMinutes)
        {
            try
            {
                if (string.IsNullOrEmpty(email))
                {
                    return new EmailServiceResult
                    {
                        Success = false,
                        Message = "Email address is required",
                        Code = "INVALID_EMAIL"
                    };
                }

                var result = _emailProvider.ToLower() switch
                {
                    "gmail" => await SendViaGmailAsync(email, otp, expiryMinutes),
                    "mailgun" => await SendViaMailgunAsync(email, otp, expiryMinutes),
                    "sendgrid" => await SendViaSendGridAsync(email, otp, expiryMinutes),
                    "smtp" => await SendViaSMTPAsync(email, otp, expiryMinutes),
                    _ => await SendViaConsoleAsync(email, otp, expiryMinutes)
                };

                if (result.Success)
                {
                    _logger.LogInformation($"[EMAIL] OTP sent successfully to {email} using {_emailProvider}");
                }
                else
                {
                    _logger.LogWarning($"[EMAIL] Failed to send OTP to {email}: {result.Message}");
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"[EMAIL ERROR] {ex.Message}");
                return new EmailServiceResult
                {
                    Success = false,
                    Message = ex.Message,
                    Code = "EMAIL_SERVICE_ERROR"
                };
            }
        }

        private async Task<EmailServiceResult> SendViaGmailAsync(string email, string otp, int expiryMinutes)
        {
            try
            {
                var gmailUser = _configuration["Email:GmailUser"];
                var gmailAppPassword = _configuration["Email:GmailAppPassword"];

                if (string.IsNullOrEmpty(gmailUser) || string.IsNullOrEmpty(gmailAppPassword))
                {
                    return new EmailServiceResult
                    {
                        Success = false,
                        Message = "Gmail credentials not configured",
                        Code = "MISSING_CREDENTIALS"
                    };
                }

                using (var smtpClient = new SmtpClient("smtp.gmail.com", 587))
                {
                    smtpClient.EnableSsl = true;
                    smtpClient.UseDefaultCredentials = false;
                    smtpClient.Credentials = new NetworkCredential(gmailUser, gmailAppPassword);
                    smtpClient.Timeout = 10000; // 10 seconds

                    using (var mailMessage = new MailMessage(_senderEmail, email))
                    {
                        mailMessage.Subject = "Your OTP Code";
                        mailMessage.Body = GenerateHtmlBody(otp, expiryMinutes);
                        mailMessage.IsBodyHtml = true;

                        try
                        {
                            await smtpClient.SendMailAsync(mailMessage);
                            _logger.LogInformation($"[GMAIL] OTP email sent successfully to {email}");
                            return new EmailServiceResult
                            {
                                Success = true,
                                Message = "OTP sent via Gmail",
                                Code = "SUCCESS"
                            };
                        }
                        catch (SmtpException smtpEx)
                        {
                            _logger.LogError($"[GMAIL SMTP ERROR] {smtpEx.Message} | Status Code: {smtpEx.StatusCode}");
                            return new EmailServiceResult
                            {
                                Success = false,
                                Message = $"Gmail SMTP error: {smtpEx.Message}",
                                Code = "GMAIL_SMTP_ERROR"
                            };
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"[GMAIL ERROR] {ex.Message}");
                return new EmailServiceResult
                {
                    Success = false,
                    Message = ex.Message,
                    Code = "GMAIL_ERROR"
                };
            }
        }

        private async Task<EmailServiceResult> SendViaMailgunAsync(string email, string otp, int expiryMinutes)
        {
            try
            {
                var mailgunDomain = _configuration["Email:MailgunDomain"];
                var mailgunApiKey = _configuration["Email:MailgunApiKey"];
                var mailgunEmail = _configuration["Email:MailgunEmail"];

                if (string.IsNullOrEmpty(mailgunDomain) || string.IsNullOrEmpty(mailgunApiKey))
                {
                    return new EmailServiceResult
                    {
                        Success = false,
                        Message = "Mailgun credentials not configured",
                        Code = "MISSING_CREDENTIALS"
                    };
                }

                var auth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"api:{mailgunApiKey}"));
                using var request = new HttpRequestMessage(HttpMethod.Post, $"https://api.mailgun.net/v3/{mailgunDomain}/messages");
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", auth);

                var content = new MultipartFormDataContent();
                content.Add(new StringContent(_senderEmail), "from");
                content.Add(new StringContent(email), "to");
                content.Add(new StringContent("Your OTP Code"), "subject");
                content.Add(new StringContent(GenerateHtmlBody(otp, expiryMinutes), Encoding.UTF8, "text/html"), "html");

                request.Content = content;
                var response = await _httpClient.SendAsync(request);

                if (response.IsSuccessStatusCode)
                {
                    return new EmailServiceResult
                    {
                        Success = true,
                        Message = "OTP sent via Mailgun",
                        Code = "SUCCESS"
                    };
                }

                var errorContent = await response.Content.ReadAsStringAsync();
                return new EmailServiceResult
                {
                    Success = false,
                    Message = $"Mailgun API error: {response.StatusCode}",
                    Code = "MAILGUN_ERROR"
                };
            }
            catch (Exception ex)
            {
                return new EmailServiceResult
                {
                    Success = false,
                    Message = ex.Message,
                    Code = "MAILGUN_ERROR"
                };
            }
        }

        private async Task<EmailServiceResult> SendViaSendGridAsync(string email, string otp, int expiryMinutes)
        {
            try
            {
                var sendGridApiKey = _configuration["Email:SendGridApiKey"];

                if (string.IsNullOrEmpty(sendGridApiKey))
                {
                    return new EmailServiceResult
                    {
                        Success = false,
                        Message = "SendGrid API key not configured",
                        Code = "MISSING_CREDENTIALS"
                    };
                }

                var subject = "Your OTP Code";
                var htmlContent = GenerateHtmlBody(otp, expiryMinutes);

                var payload = new
                {
                    personalizations = new[] { new { to = new[] { new { email } } } },
                    from = new { email = _senderEmail },
                    subject,
                    content = new[] { new { type = "text/html", value = htmlContent } }
                };

                using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.sendgrid.com/v3/mail/send");
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", sendGridApiKey);
                request.Content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.SendAsync(request);

                if (response.IsSuccessStatusCode || response.StatusCode == System.Net.HttpStatusCode.Accepted)
                {
                    return new EmailServiceResult
                    {
                        Success = true,
                        Message = "OTP sent via SendGrid",
                        Code = "SUCCESS"
                    };
                }

                return new EmailServiceResult
                {
                    Success = false,
                    Message = $"SendGrid API error: {response.StatusCode}",
                    Code = "SENDGRID_ERROR"
                };
            }
            catch (Exception ex)
            {
                return new EmailServiceResult
                {
                    Success = false,
                    Message = ex.Message,
                    Code = "SENDGRID_ERROR"
                };
            }
        }

        private async Task<EmailServiceResult> SendViaSMTPAsync(string email, string otp, int expiryMinutes)
        {
            try
            {
                var smtpServer = _configuration["Email:SmtpServer"];
                var smtpPort = _configuration.GetValue<int>("Email:SmtpPort", 587);
                var smtpUser = _configuration["Email:SmtpUser"];
                var smtpPassword = _configuration["Email:SmtpPassword"];

                if (string.IsNullOrEmpty(smtpServer) || string.IsNullOrEmpty(smtpUser))
                {
                    return new EmailServiceResult
                    {
                        Success = false,
                        Message = "SMTP credentials not configured",
                        Code = "MISSING_CREDENTIALS"
                    };
                }

                using (var smtpClient = new SmtpClient(smtpServer, smtpPort))
                {
                    smtpClient.EnableSsl = true;
                    smtpClient.UseDefaultCredentials = false;
                    smtpClient.Credentials = new NetworkCredential(smtpUser, smtpPassword);
                    smtpClient.Timeout = 10000; // 10 seconds

                    using (var mailMessage = new MailMessage(_senderEmail, email))
                    {
                        mailMessage.Subject = "Your OTP Code";
                        mailMessage.Body = GenerateHtmlBody(otp, expiryMinutes);
                        mailMessage.IsBodyHtml = true;

                        try
                        {
                            await smtpClient.SendMailAsync(mailMessage);
                            _logger.LogInformation($"[SMTP] OTP email sent successfully to {email} via {smtpServer}:{smtpPort}");
                            return new EmailServiceResult
                            {
                                Success = true,
                                Message = "OTP sent via SMTP",
                                Code = "SUCCESS"
                            };
                        }
                        catch (SmtpException smtpEx)
                        {
                            _logger.LogError($"[SMTP ERROR] {smtpEx.Message} | Status Code: {smtpEx.StatusCode}");
                            return new EmailServiceResult
                            {
                                Success = false,
                                Message = $"SMTP error: {smtpEx.Message}",
                                Code = "SMTP_ERROR"
                            };
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"[SMTP ERROR] {ex.Message}");
                return new EmailServiceResult
                {
                    Success = false,
                    Message = ex.Message,
                    Code = "SMTP_ERROR"
                };
            }
        }

        private async Task<EmailServiceResult> SendViaConsoleAsync(string email, string otp, int expiryMinutes)
        {
            // For testing/development when no email provider is configured
            _logger.LogInformation($"[EMAIL CONSOLE] OTP for {email}: {otp}");
            _logger.LogInformation($"[EMAIL CONSOLE] Expires in: {expiryMinutes} minutes");

            return new EmailServiceResult
            {
                Success = true,
                Message = "OTP logged to console (test mode)",
                Code = "CONSOLE_MODE"
            };
        }

        private string GenerateHtmlBody(string otp, int expiryMinutes)
        {
            return $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f3f3; margin: 0; padding: 20px; }}
                    .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
                    .header {{ text-align: center; margin-bottom: 30px; }}
                    .header h1 {{ color: #333; margin: 0; font-size: 28px; }}
                    .content {{ text-align: center; }}
                    .otp-box {{ background-color: #f0f0f0; border: 2px solid #007bff; border-radius: 8px; padding: 20px; margin: 30px 0; }}
                    .otp-code {{ font-size: 36px; font-weight: bold; color: #007bff; letter-spacing: 5px; font-family: 'Courier New', monospace; }}
                    .expiry {{ color: #666; font-size: 14px; margin-top: 20px; }}
                    .footer {{ text-align: center; color: #999; font-size: 12px; margin-top: 30px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>🔐 Your Verification Code</h1>
                    </div>
                    <div class='content'>
                        <p>Hello,</p>
                        <p>Enter the code below to verify your identity:</p>
                        <div class='otp-box'>
                            <div class='otp-code'>{otp}</div>
                        </div>
                        <div class='expiry'>
                            ⏱️ This code expires in <strong>{expiryMinutes} minutes</strong>
                        </div>
                        <p style='color: #666; font-size: 14px;'>If you didn't request this code, please ignore this email.</p>
                    </div>
                    <div class='footer'>
                        <p>© {DateTime.Now.Year} Dynamic API. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";
        }
    }
}
