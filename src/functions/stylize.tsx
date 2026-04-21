import * as React from 'react';
import Link from 'next/link';
const ITALICIZED_TEXT = /{i}.+?{\/i}/;
const BOLD_TEXT = /{bold}.+?{\/bold}/;
const LINK_TEXT = /{link-(\d+)}.+?{\/link-(\d+)}/;
const SUPER_TEXT = /{super}.+?{\/super}/;
const UNDERLINE_TEXT = /{u}.+?{\/u}/;
const COLOR_TEXT = /{c}.+?{\/c}/;
const BOLD_UNDERLINE_TEXT = /{bold}{u}.+?{\/u}{\/bold}/;
const UNDERLINE_BOLD_TEXT = /{u}{bold}.+?{\/bold}{\/u}/;
const BR_TEXT = /<br\s*\/?>/;
const HYPERLINK = /{a}.+?{\/a}/;

export function stylize(
  str: string,
  navCopy?: string[],
  target?: string
): React.ReactNode | React.ReactNode[] {
  const italics_match = str.match(ITALICIZED_TEXT);
  const bold_match = str.match(BOLD_TEXT);
  const link_match = str.match(LINK_TEXT);
  const super_match = str.match(SUPER_TEXT);
  const underline_match = str.match(UNDERLINE_TEXT);
  const color_match = str.match(COLOR_TEXT);
  const bold_underline_match = str.match(BOLD_UNDERLINE_TEXT);
  const underline_bold_match = str.match(UNDERLINE_BOLD_TEXT);
  const brtag_match = str.match(BR_TEXT);
  const hyper_match = str.match(HYPERLINK);

  if (italics_match) {
    const [before, ...rest] = str.split(italics_match[0]);
    return [
      before,
      <i key={str}>{italics_match[0].replace('{i}', '').replace('{/i}', '')}</i>,
      stylize(rest.join(italics_match[0]), navCopy, target),
    ];
  } else if (bold_match) {
    const [before, ...rest] = str.split(bold_match[0]);
    return [
      before,
      <strong key={str}>{bold_match[0].replace('{bold}', '').replace('{/bold}', '')}</strong>,
      stylize(rest.join(bold_match[0]), navCopy, target),
    ];
  } else if (bold_underline_match) {
    const [before, ...rest] = str.split(bold_underline_match[0]);
    return [
      before,
      <span key={str} style={{ textDecoration: 'underline' }} className="bold">
        {bold_underline_match[0].replace('{bold}{u}', '').replace('{/u}{/bold}', '')}
      </span>,
      stylize(rest.join(bold_underline_match[0]), navCopy, target),
    ];
  } else if (underline_bold_match) {
    const [before, ...rest] = str.split(underline_bold_match[0]);
    return [
      before,
      <span key={str} style={{ textDecoration: 'underline' }} className="bold">
        {underline_bold_match[0].replace('{u}{bold}', '').replace('{/bold}{/u}', '')}
      </span>,
      stylize(rest.join(underline_bold_match[0]), navCopy, target),
    ];
  } else if (underline_match) {
    const [before, ...rest] = str.split(underline_match[0]);
    return [
      before,
      <span key={str} style={{ textDecoration: 'underline' }}>
        {underline_match[0].replace('{u}', '').replace('{/u}', '')}
      </span>,
      stylize(rest.join(underline_match[0]), navCopy, target),
    ];
  } else if (hyper_match) {
    const [before, ...rest] = str.split(hyper_match[0]);
    return [
      before,
      <Link
        key={str}
        href={hyper_match[0].replace('{a}', '').replace('{/a}', '')}
        style={{ textDecoration: 'underline', color: '#7a8f5e' }}
        target="_blank"
        rel="noopener noreferrer"
      >
        {hyper_match[0].replace('{a}', '').replace('{/a}', '')}
      </Link>,
      stylize(rest.join(hyper_match[0]), navCopy),
    ];
  } else if (color_match) {
    const [before, ...rest] = str.split(color_match[0]);
    return [
      stylize(before),
      <span key={str} className="color">
        {stylize(color_match[0].replace('{c}', '').replace('{/c}', ''))}
      </span>,
      stylize(rest.join(color_match[0]), navCopy, target),
    ];
  } else if (super_match) {
    const [before, ...rest] = str.split(super_match[0]);
    return [
      before,
      <span key={str} className="super">
        {super_match[0].replace('{super}', '').replace('{/super}', '')}
      </span>,
      stylize(rest.join(super_match[0]), navCopy, target),
    ];
  } else if (brtag_match) {
    const [before, ...rest] = str.split(brtag_match[0]);
    return [
      before,
      <span key={str} style={{ display: 'block', marginTop: '0' }}>
        {brtag_match[0].replace('<br/>', '').replace('</br>', '')}
      </span>,
      stylize(rest.join(brtag_match[0]), navCopy, target),
    ];
  } else if (link_match && navCopy) {
    const [before, ...rest] = str.split(link_match[0]);
    const LINK_OPENING_REGEX = /{link-(\d+)}/;
    const LINK_CLOSING_REGEX = /{\/link-(\d+)}/;
    const linkStr: string = link_match[0];
    const linkOpenRegex: string = LINK_OPENING_REGEX.exec(linkStr)?.[0] || '';
    const linkCloseRegex: string = LINK_CLOSING_REGEX.exec(linkStr)?.[0] || '';
    const linkIndex = LINK_OPENING_REGEX.exec(linkStr)?.[1];
    const nav = navCopy[parseInt(linkIndex || '1') - 1];
    return [
      before,
      <Link
        key={str}
        href={nav}
        className="standard-link"
        target={target}
        rel="noopener noreferrer"
        style={{ textDecoration: 'underline', color: '#7a8f5e' }}
      >
        {link_match[0].replace(linkOpenRegex, '').replace(linkCloseRegex, '')}
      </Link>,
      stylize(rest.join(''), navCopy, target),
    ];
  }
  return str;
}
