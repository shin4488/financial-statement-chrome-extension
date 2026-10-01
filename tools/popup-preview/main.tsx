import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Alert,
  Box,
  Button,
  Container,
  CssBaseline,
  FormControl,
  InputLabel,
  Link,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { scenarios } from './fixtures';

function Preview() {
  const [scenarioId, setScenarioId] = useState('normal');
  const [stockCodes, setStockCodes] = useState('192A,4478,4845,8306,8766');
  const [codes, setCodes] = useState('');
  const [requestId, setRequestId] = useState(0);
  const requestedCodes = stockCodes
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean);
  const scenario = scenarios.find((item) => item.id === scenarioId) ?? scenarios[0];
  const popupUrl = codes
    ? `/popup.html?codes=${encodeURIComponent(codes)}`
    : `/popup.html?case=${encodeURIComponent(scenario.id)}`;

  return (
    <>
      <CssBaseline />
      <Container maxWidth="md">
        <Stack spacing={2} py={3}>
          <Typography component="h1" variant="h5">
            investee 拡張の表示確認
          </Typography>
          <Alert severity="info">
            固定データは架空の企業です。実データは起動中のローカルAPIから取得します。
          </Alert>
          <FormControl fullWidth>
            <InputLabel htmlFor="preview-case">確認データ</InputLabel>
            <Select
              native
              label="確認データ"
              value={scenarioId}
              inputProps={{ id: 'preview-case' }}
              onChange={(event) => {
                setScenarioId(event.target.value);
                setCodes('');
              }}
            >
              {scenarios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </FormControl>
          <Typography>{codes ? `ローカルAPIの実決算：${codes}` : scenario.description}</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              fullWidth
              label="実決算の証券コード（カンマ区切り）"
              value={stockCodes}
              onChange={(event) => setStockCodes(event.target.value)}
            />
            <Button
              variant="outlined"
              onClick={() => {
                setCodes(requestedCodes.join(','));
                setRequestId((current) => current + 1);
              }}
              disabled={requestedCodes.length === 0}
            >
              実決算を取得
            </Button>
          </Stack>
          <Typography variant="body2">
            各カードをBS → PL → CF → フリーCF →
            ROE・ROAの順に切り替え、下へスクロールして全件を確認できます。
          </Typography>
          <Link href={popupUrl} target="_blank" rel="noopener noreferrer">
            ポップアップだけを別タブで開く
          </Link>
          <Typography variant="caption">
            実ポップアップと同じ448×600pxです。狭い画面では横へスクロールできます。
          </Typography>
          <Box overflow="auto">
            <Box
              component="iframe"
              key={`${popupUrl}-${requestId}`}
              src={popupUrl}
              title="拡張ポップアップ"
              width="28rem"
              minWidth="28rem"
              height={600}
              border={1}
              borderColor="divider"
            />
          </Box>
        </Stack>
      </Container>
    </>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(<Preview />);
