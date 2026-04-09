using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using DynamicApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using static DynamicApi.Models.ApiModels;

namespace DynamicApi.Controllers
{
    [ApiController]
    [Route("api/v1.0/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthController> _logger;

        // Global OTP storage (in production, use database or cache like Redis)
        private static readonly Dictionary<string, OtpData> OtpStorage = new();

        private class OtpData
        {
            public string Code { get; set; }
            public DateTime ExpiresAt { get; set; }
            public int Attempts { get; set; }
        }

        public AuthController(
            IEmailService emailService,
            ILogger<AuthController> logger)
        {
            _emailService = emailService;
            _logger = logger;
        }

        /// <summary>
        /// Send OTP to email address
        /// </summary>
        /// <param name="request">Request containing email</param>
        /// <returns>OTP send result</returns>
        [HttpPost("send-otp")]
        [ProducesResponseType(typeof(ApiResponse<object>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 500)]
        public async Task<IActionResult> SendOtp([FromBody] OtpRequest request)
        {
            try
            {
                // Validate email
                var email = request?.Email?.Trim();
                if (string.IsNullOrEmpty(email) || !IsValidEmail(email))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Status = false,
                        Message = "Invalid email address",
                        Data = null
                    });
                }

                // Generate 6-digit OTP
                var random = new Random();
                var otp = random.Next(100000, 999999).ToString();

                // Store OTP with expiry (10 minutes)
                var expiryTime = DateTime.UtcNow.AddMinutes(10);
                OtpStorage[email] = new OtpData
                {
                    Code = otp,
                    ExpiresAt = expiryTime,
                    Attempts = 0
                };

                // Send OTP email
                var emailResult = await _emailService.SendOtpEmailAsync(email, otp, 10);

                if (emailResult.Success)
                {
                    _logger.LogInformation($"[OTP] Generated for {email}: {otp} (expires at {expiryTime:O})");

                    return Ok(new ApiResponse<object>
                    {
                        Status = true,
                        Message = "OTP sent successfully. Check your email.",
                        Data = new
                        {
                            email,
                            expiresIn = 600 // seconds
                        }
                    });
                }
                else
                {
                    return StatusCode(500, new ApiResponse<object>
                    {
                        Status = false,
                        Message = "Failed to send OTP email",
                        Data = new { error = emailResult.Message }
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"[OTP Send Error] {ex.Message}");
                return StatusCode(500, new ApiResponse<object>
                {
                    Status = false,
                    Message = "Server error while sending OTP",
                    Data = new { error = ex.Message }
                });
            }
        }

        /// <summary>
        /// Verify OTP code
        /// </summary>
        /// <param name="request">Request containing email and OTP code</param>
        /// <returns>Verification result</returns>
        [HttpPost("verify-otp")]
        [ProducesResponseType(typeof(ApiResponse<object>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 500)]
        public IActionResult VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            try
            {
                var email = request?.Email?.Trim();
                var otp = request?.Otp?.Trim();

                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(otp))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Status = false,
                        Message = "Email and OTP are required",
                        Data = null
                    });
                }

                // Check if OTP exists
                if (!OtpStorage.ContainsKey(email))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Status = false,
                        Message = "OTP not found. Please request a new one.",
                        Data = null
                    });
                }

                var storedOtp = OtpStorage[email];

                // Check expiry
                if (DateTime.UtcNow > storedOtp.ExpiresAt)
                {
                    OtpStorage.Remove(email);
                    return BadRequest(new ApiResponse<object>
                    {
                        Status = false,
                        Message = "OTP has expired. Please request a new one.",
                        Data = null
                    });
                }

                // Check attempts
                if (storedOtp.Attempts >= 5)
                {
                    OtpStorage.Remove(email);
                    return BadRequest(new ApiResponse<object>
                    {
                        Status = false,
                        Message = "Too many invalid attempts. Please request a new OTP.",
                        Data = null
                    });
                }

                // Verify OTP
                if (storedOtp.Code != otp)
                {
                    storedOtp.Attempts++;
                    return BadRequest(new ApiResponse<object>
                    {
                        Status = false,
                        Message = "Invalid OTP. Please try again.",
                        Data = new { attemptsRemaining = 5 - storedOtp.Attempts }
                    });
                }

                // OTP verified successfully
                OtpStorage.Remove(email);
                var userId = $"user_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";

                _logger.LogInformation($"[OTP Verified] User {email} authenticated successfully");

                return Ok(new ApiResponse<object>
                {
                    Status = true,
                    Message = "OTP verified successfully",
                    Data = new
                    {
                        userId,
                        email,
                        authenticatedAt = DateTime.UtcNow.ToString("O")
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[OTP Verification Error] {ex.Message}");
                return StatusCode(500, new ApiResponse<object>
                {
                    Status = false,
                    Message = "Server error while verifying OTP",
                    Data = new { error = ex.Message }
                });
            }
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var pattern = @"^[^\s@]+@[^\s@]+\.[^\s@]+$";
                return Regex.IsMatch(email, pattern);
            }
            catch
            {
                return false;
            }
        }
    }

    // Request/Response Models
    public class OtpRequest
    {
        public string Email { get; set; }
    }

    public class VerifyOtpRequest
    {
        public string Email { get; set; }
        public string Otp { get; set; }
    }
}
