//! 程序员模式：位运算和进制转换

/// 位运算操作
#[derive(Debug, Clone, Copy)]
pub enum BitOp {
    And,
    Or,
    Xor,
    Not,
    LShift,
    RShift,
}

/// 进制
#[derive(Debug, Clone, Copy)]
pub enum Base {
    Hex = 16,
    Dec = 10,
    Oct = 8,
    Bin = 2,
}

/// 在指定进制下解析字符串为 i64
pub fn parse_value(s: &str, base: Base) -> Result<i64, String> {
    let s = s.trim();
    if s.is_empty() {
        return Ok(0);
    }
    let radix = base as u32;
    let s_clean = match base {
        Base::Hex => s.strip_prefix("0x").or_else(|| s.strip_prefix("0X")).unwrap_or(s),
        Base::Bin => s.strip_prefix("0b").or_else(|| s.strip_prefix("0B")).unwrap_or(s),
        _ => s,
    };
    // 只保留合法字符
    let filtered: String = s_clean.chars().filter(|c| c.is_ascii_alphanumeric()).collect();
    i64::from_str_radix(&filtered, radix).map_err(|_| format!("无效的{}进制数", base_str(base)))
}

/// 格式化 i64 到指定进制，带分组
pub fn format_value(val: i64, base: Base) -> String {
    let raw = match base {
        Base::Hex => format!("{:X}", val),
        Base::Dec => val.to_string(),
        Base::Oct => format!("{:o}", val),
        Base::Bin => format!("{:b}", val),
    };
    group_digits(&raw, base)
}

/// 按字节/千位分组
fn group_digits(s: &str, base: Base) -> String {
    if s.is_empty() || s == "0" {
        return s.to_string();
    }
    let (prefix, digits) = if s.starts_with('-') {
        ("-", &s[1..])
    } else {
        ("", s)
    };
    let group_size = match base {
        Base::Bin => 4,  // 每4位一组（半字节）
        Base::Oct => 3,  // 每3位一组
        Base::Hex => 4,  // 每4位一组
        Base::Dec => 3,  // 每3位一组（千位分隔）
    };
    let mut result = String::new();
    let chars: Vec<char> = digits.chars().collect();
    let len = chars.len();
    let first_group = len % group_size;
    if first_group > 0 {
        for c in &chars[..first_group] {
            result.push(*c);
        }
        if len > first_group {
            result.push(' ');
        }
    }
    for i in (first_group..len).step_by(group_size) {
        for c in &chars[i..(i + group_size).min(len)] {
            result.push(*c);
        }
        if i + group_size < len {
            result.push(' ');
        }
    }
    format!("{}{}", prefix, result)
}

fn base_str(base: Base) -> &'static str {
    match base {
        Base::Hex => "十六",
        Base::Dec => "十",
        Base::Oct => "八",
        Base::Bin => "二",
    }
}

/// 执行位运算
pub fn execute_bitwise(op: BitOp, a: i64, b: i64) -> i64 {
    match op {
        BitOp::And => a & b,
        BitOp::Or => a | b,
        BitOp::Xor => a ^ b,
        BitOp::Not => !a,
        BitOp::LShift => a.wrapping_shl(b as u32),
        BitOp::RShift => a.wrapping_shr(b as u32),
    }
}

/// 智能转换：将字符串从 from_base 解析并格式化为所有四种进制
pub fn convert_all(value: &str, from_base: Base) -> Result<[String; 4], String> {
    let val = parse_value(value, from_base)?;
    Ok([
        format_value(val, Base::Hex),
        format_value(val, Base::Dec),
        format_value(val, Base::Oct),
        format_value(val, Base::Bin),
    ])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hex_to_dec() {
        let val = parse_value("FF", Base::Hex).unwrap();
        assert_eq!(val, 255);
    }

    #[test]
    fn test_dec_to_bin() {
        let s = format_value(10, Base::Bin);
        assert_eq!(s, "1010");
    }

    #[test]
    fn test_and() {
        assert_eq!(execute_bitwise(BitOp::And, 0b1100, 0b1010), 0b1000);
    }

    #[test]
    fn test_or() {
        assert_eq!(execute_bitwise(BitOp::Or, 0b1100, 0b1010), 0b1110);
    }

    #[test]
    fn test_xor() {
        assert_eq!(execute_bitwise(BitOp::Xor, 0b1100, 0b1010), 0b0110);
    }

    #[test]
    fn test_not() {
        assert_eq!(execute_bitwise(BitOp::Not, 0, 0), -1);
    }

    #[test]
    fn test_lshift() {
        assert_eq!(execute_bitwise(BitOp::LShift, 1, 4), 16);
    }

    #[test]
    fn test_bin_grouping() {
        let s = format_value(0b111100001111, Base::Bin);
        assert!(s.contains(' '));
    }

    #[test]
    fn test_hex_grouping() {
        let s = format_value(0xABCD1234, Base::Hex);
        assert!(s.contains(' '));
    }

    #[test]
    fn test_convert_all() {
        let results = convert_all("255", Base::Dec).unwrap();
        assert_eq!(results[0], "FF");       // hex
        assert_eq!(results[1], "255");      // dec
        assert_eq!(results[2], "377");      // oct
        assert_eq!(results[3], "1111 1111"); // bin
    }
}
