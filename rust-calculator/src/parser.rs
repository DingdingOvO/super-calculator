//! 递归下降表达式解析器
//! 支持科学计算器函数：sin, cos, tan, log, ln, sqrt, 阶乘, 幂运算等
//! 使用 libm 保证三角函数跨平台一致性

use std::f64::consts;

/// 角度模式
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum AngleMode {
    Degrees,
    Radians,
}

/// 分词器
struct Lexer {
    chars: Vec<char>,
    pos: usize,
}

#[derive(Debug, Clone, PartialEq)]
enum Token {
    Number(f64),
    Plus,
    Minus,
    Star,
    Slash,
    Percent,
    Caret,      // ^
    LParen,
    RParen,
    Sin,
    Cos,
    Tan,
    Log,
    Ln,
    Sqrt,
    Factorial,  // !
    Square,     // ²
    Cube,       // ³
    Pi,
    E,
    Comma,
    End,
}

impl Lexer {
    fn new(input: &str) -> Self {
        let chars: Vec<char> = input.chars().collect();
        Self { chars, pos: 0 }
    }

    fn peek(&self) -> Option<char> {
        self.chars.get(self.pos).copied()
    }

    fn advance(&mut self) -> Option<char> {
        let c = self.chars.get(self.pos).copied();
        self.pos += 1;
        c
    }

    fn skip_whitespace(&mut self) {
        while let Some(c) = self.peek() {
            if c.is_ascii_whitespace() {
                self.advance();
            } else {
                break;
            }
        }
    }

    fn next_token(&mut self) -> Result<Token, String> {
        self.skip_whitespace();
        match self.peek() {
            None => Ok(Token::End),
            Some(c) => match c {
                '+' => { self.advance(); Ok(Token::Plus) }
                '-' => { self.advance(); Ok(Token::Minus) }
                '*' => { self.advance(); Ok(Token::Star) }
                '/' => { self.advance(); Ok(Token::Slash) }
                '%' => { self.advance(); Ok(Token::Percent) }
                '^' => { self.advance(); Ok(Token::Caret) }
                '(' => { self.advance(); Ok(Token::LParen) }
                ')' => { self.advance(); Ok(Token::RParen) }
                ',' => { self.advance(); Ok(Token::Comma) }
                '!' => { self.advance(); Ok(Token::Factorial) }
                '²' => { self.advance(); Ok(Token::Square) }
                '³' => { self.advance(); Ok(Token::Cube) }
                '0'..='9' | '.' => self.read_number(),
                'p' | 'P' => {
                    self.advance();
                    if self.peek() == Some('i') || self.peek() == Some('I') {
                        self.advance();
                        Ok(Token::Pi)
                    } else {
                        Err("未知标识符: p".to_string())
                    }
                }
                'e' | 'E' => {
                    self.advance();
                    // 检查是否是独立的 e (常数) 还是函数名开头
                    match self.peek() {
                        Some(c) if c.is_ascii_alphabetic() || c == '(' => {
                            // 可能是 "e" 常数后跟表达式，或者是 "e" 在数字科学计数法中？
                            // 在科学计数法语境下我们不处理，直接作为常数 e
                            Ok(Token::E)
                        }
                        _ => Ok(Token::E)
                    }
                }
                's' | 'S' => {
                    self.advance(); // consume 's'
                    match self.peek() {
                        Some('i') | Some('I') => {
                            self.advance();
                            if self.peek() == Some('n') || self.peek() == Some('N') {
                                self.advance();
                                Ok(Token::Sin)
                            } else {
                                Err("未知标识符: si".to_string())
                            }
                        }
                        Some('q') | Some('Q') => {
                            self.advance();
                            if self.peek() == Some('r') || self.peek() == Some('R') {
                                self.advance();
                                if self.peek() == Some('t') || self.peek() == Some('T') {
                                    self.advance();
                                    Ok(Token::Sqrt)
                                } else {
                                    Err("未知标识符: sqr".to_string())
                                }
                            } else {
                                Err("未知标识符: sq".to_string())
                            }
                        }
                        _ => Err("未知标识符: s".to_string())
                    }
                }
                'c' | 'C' => {
                    self.advance();
                    if self.peek() == Some('o') || self.peek() == Some('O') {
                        self.advance();
                        if self.peek() == Some('s') || self.peek() == Some('S') {
                            self.advance();
                            Ok(Token::Cos)
                        } else {
                            Err("未知标识符: co".to_string())
                        }
                    } else {
                        Err("未知标识符: c".to_string())
                    }
                }
                't' | 'T' => {
                    self.advance();
                    if self.peek() == Some('a') || self.peek() == Some('A') {
                        self.advance();
                        if self.peek() == Some('n') || self.peek() == Some('N') {
                            self.advance();
                            Ok(Token::Tan)
                        } else {
                            Err("未知标识符: ta".to_string())
                        }
                    } else {
                        Err("未知标识符: t".to_string())
                    }
                }
                'l' | 'L' => {
                    self.advance(); // consume 'l'
                    match self.peek() {
                        Some('o') | Some('O') => {
                            self.advance();
                            if self.peek() == Some('g') || self.peek() == Some('G') {
                                self.advance();
                                Ok(Token::Log)
                            } else {
                                Err("未知标识符: lo".to_string())
                            }
                        }
                        Some('n') | Some('N') => {
                            self.advance();
                            Ok(Token::Ln)
                        }
                        _ => Err("未知标识符: l".to_string())
                    }
                }
                _ => Err(format!("未知字符: '{}'", c))
            }
        }
    }

    fn read_number(&mut self) -> Result<Token, String> {
        let mut s = String::new();
        while let Some(c) = self.peek() {
            if c.is_ascii_digit() || c == '.' {
                s.push(c);
                self.advance();
            } else {
                break;
            }
        }
        let val: f64 = s.parse().map_err(|_| format!("无效数字: {}", s))?;
        Ok(Token::Number(val))
    }
}

/// 递归下降解析器
struct Parser {
    lexer: Lexer,
    current: Token,
    _angle_mode: AngleMode,
}

impl Parser {
    fn new(input: &str, angle_mode: AngleMode) -> Result<Self, String> {
        let mut lexer = Lexer::new(input);
        let current = lexer.next_token()?;
        Ok(Self { lexer, current, _angle_mode: angle_mode })
    }

    fn advance(&mut self) -> Result<(), String> {
        self.current = self.lexer.next_token()?;
        Ok(())
    }

    // expression → term (("+" | "-") term)*
    fn parse_expression(&mut self) -> Result<f64, String> {
        let mut result = self.parse_term()?;
        loop {
            match &self.current {
                Token::Plus => {
                    self.advance()?;
                    result += self.parse_term()?;
                }
                Token::Minus => {
                    self.advance()?;
                    result -= self.parse_term()?;
                }
                _ => break,
            }
        }
        Ok(result)
    }

    // term → factor (("*" | "/" | "%") factor)*
    fn parse_term(&mut self) -> Result<f64, String> {
        let mut result = self.parse_factor()?;
        loop {
            match &self.current {
                Token::Star => {
                    self.advance()?;
                    result *= self.parse_factor()?;
                }
                Token::Slash => {
                    self.advance()?;
                    let divisor = self.parse_factor()?;
                    if divisor == 0.0 {
                        return Err("除数不能为零".to_string());
                    }
                    result /= divisor;
                }
                Token::Percent => {
                    self.advance()?;
                    result /= 100.0;
                }
                _ => break,
            }
        }
        Ok(result)
    }

    // factor → power (("^") power)?
    fn parse_factor(&mut self) -> Result<f64, String> {
        let base = self.parse_power()?;
        if self.current == Token::Caret {
            self.advance()?;
            let exp = self.parse_power()?;
            return Ok(base.powf(exp));
        }
        Ok(base)
    }

    // power → unary ("!" | "²" | "³")?
    fn parse_power(&mut self) -> Result<f64, String> {
        let mut val = self.parse_unary()?;
        match &self.current {
            Token::Factorial => {
                self.advance()?;
                val = factorial(val)?;
            }
            Token::Square => {
                self.advance()?;
                val = val * val;
            }
            Token::Cube => {
                self.advance()?;
                val = val * val * val;
            }
            _ => {}
        }
        Ok(val)
    }

    // unary → ("-" | "+") unary | primary
    fn parse_unary(&mut self) -> Result<f64, String> {
        match &self.current {
            Token::Minus => {
                self.advance()?;
                let val = self.parse_unary()?;
                Ok(-val)
            }
            Token::Plus => {
                self.advance()?;
                self.parse_unary()
            }
            _ => self.parse_primary(),
        }
    }

    // primary → NUMBER | "(" expression ")" | FUNCTION "(" expression ")" | CONSTANT
    fn parse_primary(&mut self) -> Result<f64, String> {
        match &self.current {
            Token::Number(n) => {
                let val = *n;
                self.advance()?;
                Ok(val)
            }
            Token::Pi => {
                self.advance()?;
                Ok(consts::PI)
            }
            Token::E => {
                self.advance()?;
                Ok(consts::E)
            }
            Token::LParen => {
                self.advance()?;
                let val = self.parse_expression()?;
                if self.current != Token::RParen {
                    return Err("缺少右括号".to_string());
                }
                self.advance()?;
                Ok(val)
            }
            Token::Sin => self.parse_function(trig_sin),
            Token::Cos => self.parse_function(trig_cos),
            Token::Tan => self.parse_function(trig_tan),
            Token::Log => self.parse_function(|x| Ok(x.log10())),
            Token::Ln => self.parse_function(|x| {
                if x <= 0.0 { Err("对数输入必须为正数".to_string()) } else { Ok(x.ln()) }
            }),
            Token::Sqrt => self.parse_function(|x| {
                if x < 0.0 { Err("负数不能开平方".to_string()) } else { Ok(x.sqrt()) }
            }),
            _ => Err(format!("意外的语法元素: {:?}", self.current)),
        }
    }

    fn parse_function(&mut self, f: fn(f64) -> Result<f64, String>) -> Result<f64, String> {
        self.advance()?; // consume function token
        if self.current != Token::LParen {
            return Err("函数名后需要左括号".to_string());
        }
        self.advance()?;
        let val = self.parse_expression()?;
        if self.current != Token::RParen {
            return Err("缺少右括号".to_string());
        }
        self.advance()?;
        f(val)
    }

    fn parse_all(mut self) -> Result<f64, String> {
        let result = self.parse_expression()?;
        if self.current != Token::End {
            return Err(format!("表达式末尾有多余内容: {:?}", self.current));
        }
        Ok(result)
    }
}

fn trig_sin(x: f64) -> Result<f64, String> {
    Ok(libm::sin(x * consts::PI / 180.0))
}

fn trig_cos(x: f64) -> Result<f64, String> {
    Ok(libm::cos(x * consts::PI / 180.0))
}

fn trig_tan(x: f64) -> Result<f64, String> {
    let rad = x * consts::PI / 180.0;
    let cos_val = libm::cos(rad);
    if cos_val.abs() < 1e-15 {
        return Err("tan 无定义".to_string());
    }
    Ok(libm::tan(rad))
}

/// 阶乘计算
fn factorial(n: f64) -> Result<f64, String> {
    if n < 0.0 || n != n.floor() {
        return Err("阶乘只能用于非负整数".to_string());
    }
    let n_int = n as u64;
    let mut result = 1.0_f64;
    for i in 2..=n_int {
        result *= i as f64;
    }
    Ok(result)
}

/// 主入口：解析并计算表达式
pub fn evaluate(expr: &str, angle_mode: AngleMode) -> Result<f64, String> {
    let parser = Parser::new(expr, angle_mode)?;
    parser.parse_all()
}

/// 格式化计算结果（去掉多余的尾部零）
pub fn format_result(val: f64) -> String {
    if val.is_nan() || val.is_infinite() {
        return "无效输入".to_string();
    }
    let s = format!("{:.15}", val);
    // 去掉尾部多余的零
    if let Some(_dot_pos) = s.find('.') {
        let trimmed = s.trim_end_matches('0');
        let trimmed = trimmed.trim_end_matches('.');
        if trimmed.is_empty() || trimmed == "-" {
            "0".to_string()
        } else {
            trimmed.to_string()
        }
    } else {
        s
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_addition() {
        let result = evaluate("2+3", AngleMode::Degrees).unwrap();
        assert!((result - 5.0).abs() < 1e-10);
    }

    #[test]
    fn test_complex_expression() {
        let result = evaluate("2+3*4", AngleMode::Degrees).unwrap();
        assert!((result - 14.0).abs() < 1e-10);
    }

    #[test]
    fn test_parentheses() {
        let result = evaluate("(2+3)*4", AngleMode::Degrees).unwrap();
        assert!((result - 20.0).abs() < 1e-10);
    }

    #[test]
    fn test_sin_30() {
        let result = evaluate("sin(30)", AngleMode::Degrees).unwrap();
        assert!((result - 0.5).abs() < 1e-10);
    }

    #[test]
    fn test_cos_60() {
        let result = evaluate("cos(60)", AngleMode::Degrees).unwrap();
        assert!((result - 0.5).abs() < 1e-10);
    }

    #[test]
    fn test_tan_45() {
        let result = evaluate("tan(45)", AngleMode::Degrees).unwrap();
        assert!((result - 1.0).abs() < 1e-10);
    }

    #[test]
    fn test_log() {
        let result = evaluate("log(100)", AngleMode::Degrees).unwrap();
        assert!((result - 2.0).abs() < 1e-10);
    }

    #[test]
    fn test_ln() {
        let result = evaluate("ln(e)", AngleMode::Degrees).unwrap();
        assert!((result - 1.0).abs() < 1e-10);
    }

    #[test]
    fn test_sqrt() {
        let result = evaluate("sqrt(9)", AngleMode::Degrees).unwrap();
        assert!((result - 3.0).abs() < 1e-10);
    }

    #[test]
    fn test_power() {
        let result = evaluate("2^3", AngleMode::Degrees).unwrap();
        assert!((result - 8.0).abs() < 1e-10);
    }

    #[test]
    fn test_factorial() {
        let result = evaluate("5!", AngleMode::Degrees).unwrap();
        assert!((result - 120.0).abs() < 1e-10);
    }

    #[test]
    fn test_neg_sqrt_error() {
        let result = evaluate("sqrt(-1)", AngleMode::Degrees);
        assert!(result.is_err());
    }

    #[test]
    fn test_divide_by_zero_error() {
        let result = evaluate("1/0", AngleMode::Degrees);
        assert!(result.is_err());
    }

    #[test]
    fn test_pi_constant() {
        let result = evaluate("pi", AngleMode::Degrees).unwrap();
        assert!((result - consts::PI).abs() < 1e-10);
    }

    #[test]
    fn test_sin_30_expr() {
        // 测试更复杂的 sin 表达式
        let result = evaluate("sin(30+30)", AngleMode::Degrees).unwrap();
        assert!((result - 0.866_025_403_784_438_6_f64).abs() < 1e-10);
    }
}
