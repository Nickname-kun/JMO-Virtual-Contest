"use client";
import { HStack, Icon, Link as ChakraLink } from "@chakra-ui/react";
import { FaXTwitter, FaGithub, FaGlobe } from "react-icons/fa6";
import { HiAtSymbol } from "react-icons/hi";

type Props = {
  twitter?: string;
  github?: string;
  website?: string;
  omc?: string;
};

// OMC表示用のユーザー名抽出関数
function getOmcDisplayName(omc: string): string {
  if (omc.startsWith('http')) {
    // OMC公式URL形式の場合、ユーザー名部分を抽出
    const match = omc.match(/onlinemathcontest.com\/users\/([^/?#]+)/);
    if (match && match[1]) return match[1];
    // それ以外のURLの場合は省略表示
    return 'OMC';
  }
  return omc;
}

// Twitter(X)表示用のユーザー名抽出関数（twitter.com, x.com両対応）
function getTwitterDisplayName(twitter: string): string | null {
  if (twitter.startsWith('http')) {
    // twitter.com または x.com のどちらにも対応
    const match = twitter.match(/(?:twitter.com|x.com)\/(#!\/)?([A-Za-z0-9_]+)/);
    if (match && match[2]) return '@' + match[2];
    // ユーザー名が抽出できなければ何も表示しない
    return null;
  }
  // @を先頭につけて表示
  const name = twitter.replace(/^@/, '');
  return name ? '@' + name : null;
}

// GitHub表示用のユーザー名抽出関数
function getGithubDisplayName(github: string): string {
  if (github.startsWith('http')) {
    const match = github.match(/github.com\/([A-Za-z0-9_-]+)/);
    if (match && match[1]) return 'GitHub: ' + match[1];
    return 'GitHub';
  }
  return 'GitHub: ' + github;
}

export default function SnsLinks({ twitter, github, website, omc }: Props) {
  return (
    <HStack spacing={4} justify="center" mb={2}>
      {(() => {
        const tw = twitter ?? "";
        const display = tw ? getTwitterDisplayName(tw) : null;
        if (!display) return null;
        return (
          <ChakraLink
            href={tw.startsWith("http") ? tw : `https://twitter.com/${tw.replace(/^@/, "")}`}
            isExternal
            aria-label="X (Twitter)"
            display="flex"
            alignItems="center"
          >
            <Icon as={FaXTwitter} boxSize={5} mr={1} />
            <span>{display}</span>
          </ChakraLink>
        );
      })()}
      {github && (
        <ChakraLink
          href={github.startsWith("http") ? github : `https://github.com/${github}`}
          isExternal
          aria-label="GitHub"
          display="flex"
          alignItems="center"
        >
          <Icon as={FaGithub} boxSize={5} mr={1} />
          <span>{getGithubDisplayName(github)}</span>
        </ChakraLink>
      )}
      {website && (
        <ChakraLink
          href={website}
          isExternal
          aria-label="個人ウェブサイト"
          display="flex"
          alignItems="center"
        >
          <Icon as={FaGlobe} boxSize={5} mr={1} />
          <span>Webサイト</span>
        </ChakraLink>
      )}
      {omc && (
        <ChakraLink
          href={omc.startsWith("http") ? omc : `https://onlinemathcontest.com/users/${omc}`}
          isExternal
          aria-label="OMC"
          display="flex"
          alignItems="center"
        >
          <Icon as={HiAtSymbol} boxSize={5} mr={1} />
          <span>OMC: {getOmcDisplayName(omc)}</span>
        </ChakraLink>
      )}
    </HStack>
  );
} 