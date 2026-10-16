import React from 'react';
import { trackEvent } from '../../analytics';
import { connect } from 'react-redux';
import { DefaultLayoutProps } from './props';
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Link,
  AppBar,
  Toolbar,
  Box,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { AppDispatch } from '@/store/store';
import { RootState } from '@/store/store';
import { changeAutoPlayStatus } from '@/store/slices/autoPlayStatusSlice';
import { bindActionCreators } from '@reduxjs/toolkit';

const autoPlayStatusLocalStorageKey = 'investeeExtensionIsStatementAutoPlay';

// store更新・アクセスするための設定
const mapStateToProps = (state: RootState) => ({
  isAutoPlay: state.autoPlayStatus.isAutoPlay,
  stockCode: state.sitePage.stockCode,
});
const mapDispatchToProps = (dispatch: AppDispatch) => ({
  actions: bindActionCreators({ changeAutoPlayStatus }, dispatch),
});
type DefaultLayoutWithStoreProps = DefaultLayoutProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>;

class DefaultLayout extends React.Component<DefaultLayoutWithStoreProps> {
  state = {
    analyticsEnabled: localStorage.getItem('investeeExtensionAnalyticsEnabled') !== 'false',
  };

  componentDidMount(): void {
    const isAutoPlay = (localStorage.getItem(autoPlayStatusLocalStorageKey) || 'true') === 'true';
    this.props.actions.changeAutoPlayStatus(isAutoPlay);
  }

  render(): React.ReactNode {
    // 複数ページ共通で使用したい内容があればこのコンポーネントに記述する。
    // 出典はスクロールする領域の外に置き、窓の下端に常に表示する（重ねると最後の行や操作ボタンを隠す）
    return (
      <Box display="flex" flexDirection="column" height="100%">
        <Box flex={1} minHeight={0} overflow="auto">
          <AppBar position="sticky" color="default">
            <Toolbar variant="dense">
              <Grid container size={12} columnSpacing={3} alignItems="center">
                <Grid>
                  <FormControl>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={this.props.isAutoPlay}
                          onChange={(event) => {
                            trackEvent('analysis_interaction', {
                              interaction_type: event.target.checked
                                ? 'autoplay_on'
                                : 'autoplay_off',
                            });
                            this.props.actions.changeAutoPlayStatus(event.target.checked);
                            localStorage.setItem(
                              autoPlayStatusLocalStorageKey,
                              String(event.target.checked),
                            );
                          }}
                        />
                      }
                      label="自動切替"
                      labelPlacement="start"
                    />
                  </FormControl>
                </Grid>
                <Grid>
                  <Typography>
                    企業比較するなら
                    <Link
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`https://investee.info/?stock-codes=${encodeURIComponent(
                        this.props.stockCode ?? '',
                      )}&utm_source=investee_extension&utm_medium=referral&utm_campaign=compare`}
                      onClick={() => trackEvent('outbound_click', { link_domain: 'investee.info' })}
                      underline="none"
                    >
                      investee.info
                    </Link>
                    へ
                  </Typography>
                </Grid>
              </Grid>
            </Toolbar>
          </AppBar>

          <Box component="main">{this.props.children}</Box>
          <Box px={2} pb={1}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={this.state.analyticsEnabled}
                  onChange={(event) => {
                    localStorage.setItem(
                      'investeeExtensionAnalyticsEnabled',
                      String(event.target.checked),
                    );
                    this.setState({ analyticsEnabled: event.target.checked });
                  }}
                />
              }
              label={<Typography variant="caption">改善のため利用状況を送信する</Typography>}
            />
            <Link
              href="https://investee.info/privacy"
              target="_blank"
              rel="noopener noreferrer"
              variant="caption"
            >
              送信する情報
            </Link>
          </Box>
        </Box>

        <Box component="footer" sx={{ opacity: 0.7 }}>
          出典:
          <Link
            target="_blank"
            rel="noopener noreferrer"
            href="https://disclosure2.edinet-fsa.go.jp/WEEK0010.aspx"
            underline="none"
          >
            EDINET閲覧（提出）サイト
          </Link>
          より抜粋して作成
        </Box>
      </Box>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DefaultLayout);
