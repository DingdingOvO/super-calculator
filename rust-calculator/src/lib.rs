mod state;
mod engine;
mod parser;

pub use state::{CalculatorState, CalculatorMode, Operator};
pub use engine::CalculatorEngine;

use wasm_bindgen::prelude::*;

/// WASM 绑定的计算器包装器
#[wasm_bindgen]
pub struct WasmCalculator {
    state: CalculatorState,
}

#[wasm_bindgen]
impl WasmCalculator {
    /// 创建一个新的计算器实例
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            state: CalculatorState::new(),
        }
    }

    /// 输入数字（0-9）
    pub fn input_digit(&mut self, digit: char) {
        if digit.is_ascii_digit() {
            CalculatorEngine::input_digit(&mut self.state, digit);
        } else if digit == '.' {
            CalculatorEngine::decimal_point(&mut self.state);
        }
    }

    /// 输入运算符：add, subtract, multiply, divide
    pub fn input_operator(&mut self, op: &str) {
        let operator = match op {
            "add" => Operator::Add,
            "subtract" => Operator::Subtract,
            "multiply" => Operator::Multiply,
            "divide" => Operator::Divide,
            _ => return,
        };
        CalculatorEngine::input_operator(&mut self.state, operator);
    }

    /// 执行等号计算
    pub fn evaluate(&mut self) {
        CalculatorEngine::evaluate(&mut self.state);
    }

    /// 清除所有
    pub fn clear(&mut self) {
        CalculatorEngine::clear(&mut self.state);
    }

    /// 退格
    pub fn backspace(&mut self) {
        CalculatorEngine::backspace(&mut self.state);
    }

    /// 正负号切换
    pub fn negate(&mut self) {
        CalculatorEngine::negate(&mut self.state);
    }

    /// 百分号
    pub fn percent(&mut self) {
        CalculatorEngine::percent(&mut self.state);
    }

    /// 获取格式化显示字符串
    pub fn get_display(&self) -> String {
        CalculatorEngine::get_display(&self.state)
    }

    /// 获取表达式字符串
    pub fn get_expression(&self) -> String {
        CalculatorEngine::get_expression(&self.state)
    }

    /// 获取当前输入原始字符串
    pub fn get_raw_input(&self) -> String {
        CalculatorEngine::get_raw_input(&self.state)
    }

    /// 是否有错误
    pub fn has_error(&self) -> bool {
        CalculatorEngine::has_error(&self.state)
    }
}

/// 科学计算模式：解析并计算表达式字符串
/// angle_mode: "deg" 或 "rad"
#[wasm_bindgen]
pub fn evaluate_expression(expr: &str, angle_mode: &str) -> String {
    let mode = match angle_mode {
        "rad" => parser::AngleMode::Radians,
        _ => parser::AngleMode::Degrees,
    };
    match parser::evaluate(expr, mode) {
        Ok(val) => parser::format_result(val),
        Err(e) => format!("错误: {}", e),
    }
}

impl Default for WasmCalculator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_wasm_basic() {
        let mut calc = WasmCalculator::new();
        calc.input_digit('5');
        calc.input_operator("add");
        calc.input_digit('3');
        calc.evaluate();
        assert_eq!(calc.get_display(), "8");
    }

    #[test]
    fn test_wasm_clear() {
        let mut calc = WasmCalculator::new();
        calc.input_digit('9');
        calc.clear();
        assert_eq!(calc.get_display(), "0");
    }

    #[test]
    fn test_wasm_error() {
        let mut calc = WasmCalculator::new();
        calc.input_digit('5');
        calc.input_operator("divide");
        calc.input_digit('0');
        calc.evaluate();
        assert!(calc.has_error());
    }

    #[test]
    fn test_evaluate_expression_sin() {
        let result = evaluate_expression("sin(30)", "deg");
        assert_eq!(result, "0.5");
    }

    #[test]
    fn test_evaluate_expression_sqrt() {
        let result = evaluate_expression("sqrt(9)", "deg");
        assert_eq!(result, "3");
    }

    #[test]
    fn test_evaluate_expression_error() {
        let result = evaluate_expression("sqrt(-1)", "deg");
        assert!(result.starts_with("错误:"));
    }
}
