import React from 'react';
import { connect } from 'react-redux';
import { DefaultLayoutProps } from './props';
import { Checkbox, FormControl, FormControlLabel, Link, AppBar, Toolbar, Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { AppDispatch } from '@/app/store';
import { RootState } from '@/app/store';
import { changeAutoPlayStatus } from '@/app/slices/autoPlayStatusSlice';
import { bindActionCreators } from '@reduxjs/toolkit';

const autoPlayStatusLocalStorageKey = 'investeeExtensionIsStatementAutoPlay';

// store更新・アクセスするための設定
const mapStateToProps = (state: RootState) => ({
  isAutoPlay: state.autoPlayStatus.isAutoPlay,
});
const mapDispatchToProps = (dispatch: AppDispatch) => ({
  actions: bindActionCreators({ changeAutoPlayStatus }, dispatch),
});
type DefaultLayoutWithStoreProps = DefaultLayoutProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>;

class DefaultLayout extends React.Component<DefaultLayoutWithStoreProps> {
  componentDidMount(): void {
    const isAutoPlay = (localStorage.getItem(autoPlayStatusLocalStorageKey) || 'true') === 'true';
    this.props.actions.changeAutoPlayStatus(isAutoPlay);
  }

  render(): React.ReactNode {
    // 複数ページ共通で使用したい内容があればこのコンポーネントに記述する
    return (
      <>
        <AppBar position="sticky" color="default" sx={{ bgcolor: 'F9F9E0' }}>
          <Toolbar sx={{ ml: -1 }} variant="dense">
            <Box>
              <Grid container size={4}>
                <FormControl>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={this.props.isAutoPlay}
                        onChange={(event) => {
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
            </Box>
          </Toolbar>
        </AppBar>

        <Box component="main">{this.props.children}</Box>

        <Box
          component="footer"
          position="fixed"
          bgcolor="white"
          zIndex="10"
          style={{ opacity: 0.7, bottom: 0 }}
        >
          出典:
          <Link
            target="_blank"
            href="https://disclosure2.edinet-fsa.go.jp/WEEK0010.aspx"
            underline="none"
          >
            EDINET閲覧（提出）サイト
          </Link>
          より抜粋して作成
        </Box>
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DefaultLayout);
