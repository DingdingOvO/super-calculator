use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

/// 计算器模式
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CalculatorMode {
    Standard,
    Scientific,
    Programmer,
    DateCalculation,
}

/// 运算符枚举
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Operator {
    Add,
    Subtract,
    Multiply,
    Divide,
}

/// 计算器状态机
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalculatorState {
    /// 当前显示的数值（字符串形式，方便逐字输入）
    pub current_input: String,
    /// 前一个操作数（Decimal 值）
    pub previous_value: Decimal,
    /// 当前选择的运算符
    pub operator: Option<Operator>,
    /// 是否刚输入完运算符（下次输入数字时清空 current_input）
    pub just_entered_operator: bool,
    /// 是否刚刚执行过计算（按等号后）
    pub just_calculated: bool,
    /// 是否有错误发生（如除零）
    pub has_error: bool,
    /// 错误信息
    pub error_message: String,
    /// 当前计算模式
    pub mode: CalculatorMode,
    /// 表达式历史记录（用于显示完整表达式）
    pub expression: String,
    /// 计算历史
    pub history: Vec<String>,
}

impl Default for CalculatorState {
    fn default() -> Self {
        Self {
            current_input: "0".to_string(),
            previous_value: Decimal::ZERO,
            operator: None,
            just_entered_operator: false,
            just_calculated: false,
            has_error: false,
            error_message: String::new(),
            mode: CalculatorMode::Standard,
            expression: String::new(),
            history: Vec::new(),
        }
    }
}

impl CalculatorState {
    /// 创建一个新的标准模式计算器状态
    pub fn new() -> Self {
        Self::default()
    }

    /// 解析当前输入为 Decimal
    pub fn current_decimal(&self) -> Decimal {
        if self.current_input.is_empty() || self.current_input == "-" {
            return Decimal::ZERO;
        }
        match Decimal::from_str_exact(&self.current_input) {
            Ok(d) => d,
            Err(_) => Decimal::ZERO,
        }
    }

    /// 重置所有状态
    pub fn clear_all(&mut self) {
        self.current_input = "0".to_string();
        self.previous_value = Decimal::ZERO;
        self.operator = None;
        self.just_entered_operator = false;
        self.just_calculated = false;
        self.has_error = false;
        self.error_message.clear();
        self.expression.clear();
    }

    /// 清除当前输入（若当前为 0 则完全重置）
    pub fn clear_entry(&mut self) {
        self.current_input = "0".to_string();
        self.has_error = false;
        self.error_message.clear();
    }

    /// 删除最后一个字符（退格）
    pub fn backspace(&mut self) {
        if self.current_input.len() <= 1 {
            self.current_input = "0".to_string();
        } else {
            self.current_input.pop();
        }
    }

    /// 追加数字
    pub fn append_digit(&mut self, digit: char) {
        if self.has_error {
            self.clear_all();
        }
        if self.just_entered_operator || self.just_calculated {
            self.current_input = "0".to_string();
            self.just_entered_operator = false;
            self.just_calculated = false;
        }
        if self.current_input == "0" && digit != '.' {
            self.current_input = digit.to_string();
        } else if digit == '.' && self.current_input.contains('.') {
            // 已有小数点则忽略
        } else {
            // 限制输入长度防止内存溢出
            if self.current_input.len() < 30 {
                self.current_input.push(digit);
            }
        }
    }

    /// 切换正负号
    pub fn negate(&mut self) {
        if self.has_error { return; }
        if self.current_input == "0" { return; }
        if self.current_input.starts_with('-') {
            self.current_input = self.current_input[1..].to_string();
        } else {
            self.current_input = format!("-{}", self.current_input);
        }
    }

    /// 百分号：将当前值除以 100
    pub fn percent(&mut self) {
        if self.has_error { return; }
        let val = self.current_decimal();
        let result = val / Decimal::from(100);
        self.current_input = Self::format_decimal(result);
    }

    /// 设置运算符，并计算之前的表达式（如果有）
    pub fn set_operator(&mut self, op: Operator) {
        if self.has_error { return; }
        if self.just_calculated {
            self.previous_value = self.current_decimal();
            self.just_calculated = false;
        } else if let Some(prev_op) = self.operator {
            // 连续运算：先计算结果，再用结果继续
            let current = self.current_decimal();
            let result = Self::perform_calculation(self.previous_value, current, prev_op);
            match result {
                Ok(val) => {
                    self.current_input = Self::format_decimal(val);
                    self.previous_value = val;
                }
                Err(err) => {
                    self.has_error = true;
                    self.error_message = err;
                    return;
                }
            }
        } else {
            self.previous_value = self.current_decimal();
        }
        self.operator = Some(op);
        self.just_entered_operator = true;
        self.build_expression();
    }

    /// 执行等号运算
    pub fn calculate(&mut self) {
        if self.has_error { return; }
        let current = self.current_decimal();
        match self.operator {
            Some(op) => {
                let result = Self::perform_calculation(self.previous_value, current, op);
                match result {
                    Ok(val) => {
                        let expr = self.build_result_expression(val);
                        self.expression = format!("{} =", expr);
                        self.current_input = Self::format_decimal(val);
                        self.previous_value = val;
                        self.operator = None;
                        self.just_calculated = true;
                        self.history.push(expr);
                    }
                    Err(err) => {
                        self.has_error = true;
                        self.error_message = err;
                    }
                }
            }
            None => {
                // 没有运算符时按等号不做任何事
            }
        }
    }

    /// 执行核心计算
    fn perform_calculation(a: Decimal, b: Decimal, op: Operator) -> Result<Decimal, String> {
        match op {
            Operator::Add => Ok(a + b),
            Operator::Subtract => Ok(a - b),
            Operator::Multiply => Ok(a * b),
            Operator::Divide => {
                if b.is_zero() {
                    Err("除数不能为零".to_string())
                } else {
                    Ok(a / b)
                }
            }
        }
    }

    /// 格式化 Decimal 为字符串（去掉尾部多余的零和小数点）
    fn format_decimal(val: Decimal) -> String {
        let s = val.to_string();
        // 如果包含小数点，去掉尾部零
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

    fn build_expression(&mut self) {
        let op_str = match self.operator {
            Some(Operator::Add) => " + ",
            Some(Operator::Subtract) => " - ",
            Some(Operator::Multiply) => " × ",
            Some(Operator::Divide) => " ÷ ",
            None => "",
        };
        self.expression = format!("{}{}", Self::format_decimal(self.previous_value), op_str);
    }

    fn build_result_expression(&mut self, result: Decimal) -> String {
        let op_str = match self.operator {
            Some(Operator::Add) => " + ",
            Some(Operator::Subtract) => " - ",
            Some(Operator::Multiply) => " × ",
            Some(Operator::Divide) => " ÷ ",
            None => "",
        };
        format!(
            "{} {} {} = {}",
            Self::format_decimal(self.previous_value),
            op_str.trim(),
            Self::format_decimal(self.current_decimal()),
            Self::format_decimal(result)
        )
    }

    /// 获取格式化后的显示值，带千位分隔符
    pub fn formatted_display(&self) -> String {
        if self.has_error {
            return self.error_message.clone();
        }
        Self::format_with_commas(&self.current_input)
    }

    fn format_with_commas(s: &str) -> String {
        if s.is_empty() { return "0".to_string(); }
        let is_neg = s.starts_with('-');
        let abs = if is_neg { &s[1..] } else { s };
        if let Some(dot_pos) = abs.find('.') {
            let int_part = &abs[..dot_pos];
            let frac_part = &abs[dot_pos..];
            let formatted_int = Self::add_commas(int_part);
            format!("{}{}{}", if is_neg { "-" } else { "" }, formatted_int, frac_part)
        } else {
            let formatted = Self::add_commas(abs);
            format!("{}{}", if is_neg { "-" } else { "" }, formatted)
        }
    }

    fn add_commas(s: &str) -> String {
        if s.len() <= 3 { return s.to_string(); }
        let mut result = String::new();
        let chars: Vec<char> = s.chars().collect();
        let len = chars.len();
        for (i, c) in chars.iter().enumerate() {
            if i > 0 && (len - i) % 3 == 0 {
                result.push(',');
            }
            result.push(*c);
        }
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_initial_state() {
        let state = CalculatorState::new();
        assert_eq!(state.current_input, "0");
        assert!(!state.has_error);
    }

    #[test]
    fn test_append_digit() {
        let mut state = CalculatorState::new();
        state.append_digit('1');
        state.append_digit('2');
        state.append_digit('3');
        assert_eq!(state.current_input, "123");
    }

    #[test]
    fn test_clear_all() {
        let mut state = CalculatorState::new();
        state.append_digit('4');
        state.append_digit('2');
        state.clear_all();
        assert_eq!(state.current_input, "0");
        assert_eq!(state.previous_value, Decimal::ZERO);
        assert!(state.operator.is_none());
    }

    #[test]
    fn test_backspace() {
        let mut state = CalculatorState::new();
        state.append_digit('1');
        state.append_digit('2');
        state.append_digit('3');
        state.backspace();
        assert_eq!(state.current_input, "12");
        state.backspace();
        assert_eq!(state.current_input, "1");
        state.backspace();
        assert_eq!(state.current_input, "0");
    }

    #[test]
    fn test_negate() {
        let mut state = CalculatorState::new();
        state.append_digit('5');
        state.negate();
        assert_eq!(state.current_input, "-5");
        state.negate();
        assert_eq!(state.current_input, "5");
    }

    #[test]
    fn test_percent() {
        let mut state = CalculatorState::new();
        state.append_digit('2');
        state.append_digit('0');
        state.percent();
        assert_eq!(state.current_input, "0.2");
    }

    #[test]
    fn test_simple_addition() {
        let mut state = CalculatorState::new();
        state.append_digit('2');
        state.set_operator(Operator::Add);
        state.append_digit('3');
        state.calculate();
        assert_eq!(state.current_input, "5");
    }

    #[test]
    fn test_continuous_operation() {
        let mut state = CalculatorState::new();
        state.append_digit('2');
        state.set_operator(Operator::Add);
        state.append_digit('3');
        state.set_operator(Operator::Add); // 中间结果 = 5
        state.append_digit('5');
        state.calculate();
        assert_eq!(state.current_input, "10");
    }

    #[test]
    fn test_divide_by_zero() {
        let mut state = CalculatorState::new();
        state.append_digit('5');
        state.set_operator(Operator::Divide);
        state.append_digit('0');
        state.calculate();
        assert!(state.has_error);
    }

    #[test]
    fn test_decimal_input() {
        let mut state = CalculatorState::new();
        state.append_digit('3');
        state.append_digit('.');
        state.append_digit('1');
        state.append_digit('4');
        assert_eq!(state.current_input, "3.14");
    }

    #[test]
    fn test_multiply() {
        let mut state = CalculatorState::new();
        state.append_digit('7');
        state.set_operator(Operator::Multiply);
        state.append_digit('8');
        state.calculate();
        assert_eq!(state.current_input, "56");
    }

    #[test]
    fn test_subtract() {
        let mut state = CalculatorState::new();
        state.append_digit('1');
        state.append_digit('0');
        state.set_operator(Operator::Subtract);
        state.append_digit('3');
        state.calculate();
        assert_eq!(state.current_input, "7");
    }

    #[test]
    fn test_format_with_commas() {
        assert_eq!(CalculatorState::format_with_commas("1000"), "1,000");
        assert_eq!(CalculatorState::format_with_commas("1234567"), "1,234,567");
        assert_eq!(CalculatorState::format_with_commas("123.456"), "123.456");
        assert_eq!(CalculatorState::format_with_commas("-5000"), "-5,000");
    }
}
