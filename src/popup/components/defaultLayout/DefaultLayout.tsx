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
import { RootState } from '@/store/store';
import { ScrollRootContext } from './scrollRoot';

const mapStateToProps = (state: RootState) => ({
  stockCode: state.sitePage.stockCode,
});
type DefaultLayoutWithStoreProps = DefaultLayoutProps & ReturnType<typeof mapStateToProps>;

class DefaultLayout extends React.Component<DefaultLayoutWithStoreProps> {
  private scrollRoot = React.createRef<HTMLDivElement>();
  state = {
    analyticsEnabled: localStorage.getItem('investeeExtensionAnalyticsEnabled') !== 'false',
  };

  render(): React.ReactNode {
    // 出典はスクロールする領域の外に置き、窓の下端に常に表示する（重ねると最後の行や操作ボタンを隠す）
    return (
      <Box display="flex" flexDirection="column" height="100%">
        <Box ref={this.scrollRoot} flex={1} minHeight={0} overflow="auto">
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
                            this.props.onAutoPlayChange(event.target.checked);
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

          <Box component="main">
            <ScrollRootContext.Provider value={this.scrollRoot}>
              {this.props.children}
            </ScrollRootContext.Provider>
          </Box>
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

        <Box component="footer" px={2} sx={{ opacity: 0.7 }}>
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

export default connect(mapStateToProps)(DefaultLayout);
