import React from 'react';
import Link from 'next/link';
import { Tooltip, Box } from '@chakra-ui/react';

// 色分けロジック
function getUserNameColor({ isAdmin, explanationCount, bestAnswerCount, userId }: { isAdmin: boolean, explanationCount: number, bestAnswerCount: number, userId: string }) {
  if (isAdmin) return 'rgb(102, 0, 153)'; // 管理者: 紫
  if (explanationCount >= 50 || bestAnswerCount >= 30) return 'rainbow'; // 虹色
  if (explanationCount >= 30 || bestAnswerCount >= 17) return '#FF3030'; // 赤
  if (explanationCount >= 20 || bestAnswerCount >= 10) return '#FF8C00'; // オレンジ
  if (explanationCount >= 15 || bestAnswerCount >= 7) return '#C9B037'; // 黄色（マスタード）
  if (explanationCount >= 10 || bestAnswerCount >= 5) return '#00BFFF'; // 水色
  if (explanationCount >= 2 || bestAnswerCount >= 1) return '#864A2B'; // チョコレート色
  return '#222'; // 通常: 黒
}

// バッジロジック
function getUserBadges({ isExplanationNo1, isBestAnswerNo1 }: { isExplanationNo1: boolean, isBestAnswerNo1: boolean }) {
  const badges = [];
  if (isExplanationNo1) badges.push(<Tooltip key="ex-no1" label="解説投稿数No.1"><span style={{marginLeft:4, fontSize:'1.1em'}} role="img" aria-label="解説王">👑</span></Tooltip>);
  if (isBestAnswerNo1) badges.push(<Tooltip key="ba-no1" label="ベストアンサー数No.1"><span style={{marginLeft:4, fontSize:'1.1em'}} role="img" aria-label="ベストアンサー王">🌟</span></Tooltip>);
  return badges;
}

interface ColoredUserNameProps {
  userId: string;
  username: string;
  isAdmin: boolean;
  explanationCount: number;
  bestAnswerCount: number;
  isProfileLink?: boolean;
  isExplanationNo1?: boolean;
  isBestAnswerNo1?: boolean;
  fontWeight?: string;
  fontSize?: string;
  isChalkboard?: boolean; // 黒板背景用
}

const ColoredUserName: React.FC<ColoredUserNameProps> = ({
  userId,
  username,
  isAdmin,
  explanationCount,
  bestAnswerCount,
  isProfileLink = true,
  isExplanationNo1 = false,
  isBestAnswerNo1 = false,
  fontWeight = 'bold',
  fontSize = 'inherit',
  isChalkboard = false,
}) => {
  const color = getUserNameColor({ isAdmin, explanationCount, bestAnswerCount, userId });
  const badges = getUserBadges({ isExplanationNo1, isBestAnswerNo1 });
  const isRainbow = color === 'rainbow';
  const nameElem = (
    <Box
      as="span"
      fontWeight={fontWeight}
      fontSize={fontSize}
      sx={
        isRainbow
          ? {
              background: 'linear-gradient(90deg, #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              ...(isChalkboard ? {
                backgroundColor: 'rgba(255,255,255,0.25)',
                borderRadius: '6px',
                padding: '0 0.4em',
                display: 'inline-block',
              } : {})
            }
          : {
              color,
              ...(isChalkboard ? {
                backgroundColor: 'rgba(255,255,255,0.25)',
                borderRadius: '6px',
                padding: '0 0.4em',
                display: 'inline-block',
              } : {})
            }
      }
    >
      {username}
    </Box>
  );
  return (
    <>
      {isProfileLink ? (
        <Link href={`/profile/${userId}`} style={{ textDecoration: 'none' }}>{nameElem}</Link>
      ) : nameElem}
      {badges}
    </>
  );
};

export default ColoredUserName; 