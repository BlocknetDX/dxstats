import { Component, NgZone, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as moment from 'moment';

import * as jQuery from 'jquery';
import {CurrentpriceService} from './currentprice.service';

declare var AmCharts;
declare var TradingView;
declare var Datafeeds;

@Component({
  selector: 'app-pricechart',
  templateUrl: './pricechart.component.html',
  styleUrls: ['./pricechart.component.scss']
})
export class PricechartComponent implements AfterViewInit {
  @ViewChild('container')
  public container: ElementRef;

  private widget: any;

  constructor(
    private currentpriceService: CurrentpriceService,
    private zone: NgZone
  ) {}

  ngAfterViewInit() {

    this.currentpriceService.getOrderHistory()
      .subscribe(items => {
        this.renderPriceChart(items);

      });

    // this.zone.runOutsideAngular(() => {
    //   this.widget = new TradingView.widget({
    //     debug: false,
    //     fullscreen: false,
    //     interval: 'W',
    //     timeframe: '1M',
    //     custom_css_url: `${window.location.origin}/assets/tv/chart-dark-theme.css`,
    //     container_id: 'tv_chart_container',
    //    //	BEWARE: no trailing slash is expected in feed URL
    //     symbol: 'AAPL',
    //    datafeed: new Datafeeds.UDFCompatibleDatafeed('https://demo_feed.tradingview.com'),
    //     // symbol: 'BTC',
    //     // datafeed: new Datafeeds.UDFCompatibleDatafeed('http://localhost:3000'),
    //     library_path: 'assets/charting_library/',
    //     locale: 'en',
         //	Regression Trend-related functionality is not implemented yet, so it's hidden for a while
    //     drawings_access: { type: 'black', tools: [{ name: 'Regression Trend' }, { name: '' }] },
    //     enabled_features: ['chart_property_page_trading' ], // 'move_logo_to_main_pane'
    //     disabled_features: ['use_localstorage_for_settings', 'left_toolbar', 'header_saveload', 'chart_property_page_scales',
    //       'header_settings', 'header_compare', 'header_undo_redo', 'chart_property_page_style', 'header_screenshot',
    //       'header_symbol_search', 'header_interval_dialog_button', 'volume_force_overlay'], // 'header_indicators',
    //     charts_storage_url: 'http://saveload.tradingview.com',
    //     charts_storage_api_version: '1.1',
    //     client_id: 'tradingview.com',
    //     user_id: 'public_user_id',
    //     toolbar_bg: '#172e48',
    //
    //     favorites: {
    //       // intervals: ['1D', '3D', '3W', 'W'],
    //       // chartTypes: ['Area', 'Line']
    //     },
    //
    //     // mainSeriesProperties.hollowCandleStyle.borderColor:'#C400CB'
    //     // mainSeriesProperties.hollowCandleStyle.borderDownColor:'#8A3A3B'
    //     // mainSeriesProperties.hollowCandleStyle.borderUpColor:'#6A833A'
    //     // mainSeriesProperties.hollowCandleStyle.downColor:'#8A3A3B'
    //     // mainSeriesProperties.hollowCandleStyle.drawBorder:true
    //     // mainSeriesProperties.hollowCandleStyle.drawWick:true
    //     // mainSeriesProperties.hollowCandleStyle.upColor:'#6A833A'
    //     // mainSeriesProperties.hollowCandleStyle.wickDownColor:'#8A3A3B'
    //     // mainSeriesProperties.hollowCandleStyle.wickUpColor:'#6A833A'
    //     // mainSeriesProperties.style:9
    //     // paneProperties.background:'#1b262d'
    //     // paneProperties.crossHairProperties.color:'#626c73'
    //     // paneProperties.horzGridProperties.color:'#28343C'
    //     // paneProperties.vertGridProperties.color:'#28343C'
    //     // scalesProperties.backgroundColor:'#1b262d'
    //     // scalesProperties.lineColor:'#555'
    //     // scalesProperties.textColor:'#999'
    //     // study_Overlay@tv-basicstudies.areaStyle.color1:'blue'
    //     // study_Overlay@tv-basicstudies.areaStyle.color2:'blue'
    //     // study_Overlay@tv-basicstudies.areaStyle.linecolor:'blue'
    //     // study_Overlay@tv-basicstudies.barStyle.downColor:'blue'
    //     // study_Overlay@tv-basicstudies.barStyle.upColor:'blue'
    //     // study_Overlay@tv-basicstudies.lineStyle.color:'blue'
    //     // symbolWatermarkProperties.color:'rgba(0, 0, 0, 0)'
    //
    //     overrides: {
    //       // 'mainSeriesProperties.style':9,
    //       //
    //       'paneProperties.background': '#0f2742',
    //       'paneProperties.vertGridProperties.color': '#0f2742',
    //       'paneProperties.horzGridProperties.color': '#0f2742',
    //       'symbolWatermarkProperties.transparency': 40,
    //       'scalesProperties.textColor': '#AAA',
    //       'mainSeriesProperties.candleStyle.upColor': '#4BF5C6',
    //       'mainSeriesProperties.candleStyle.downColor': '#FF7E70',
    //       'mainSeriesProperties.candleStyle.drawWick': true,
    //       'mainSeriesProperties.candleStyle.drawBorder': true,
    //       'mainSeriesProperties.candleStyle.borderColor': '#454545',
    //       'mainSeriesProperties.candleStyle.borderUpColor': '#4BF5C6',
    //       'mainSeriesProperties.candleStyle.borderDownColor': '#FF7E70',
    //       'mainSeriesProperties.candleStyle.wickUpColor': 'rgba( 115, 115, 117, 1)',
    //       'mainSeriesProperties.candleStyle.wickDownColor': 'rgba( 115, 115, 117, 1)',
    //       'mainSeriesProperties.candleStyle.barColorsOnPrevClose': false,
    //       'volumePaneSize': 'medium'
    //     },
    //     studies_overrides: {
    //       'volume.volume.color.0': '#4BF5C6',
    //       'volume.volume.color.1': '#FF7E70',
    //       'volume.volume.transparency': 80,
    //       'volume.show ma': false,
    //     },
    //     width: '100%',
    //     height: '100%',
    //     time_frames: [
    //         { text: '1y', resolution: 'W',  title: '1yr' },
    //         { text: '6m', resolution: 'W' },
    //         { text: '1m', resolution: 'D' },
    //         { text: '1000y', resolution: 'W', description: 'All', title: 'All' },
    //     ]
    //   });
    //
    //   this.widget.onChartReady(() => {
    //     this.zone.run(() => {
    //       // console.log('this.widget is ready');
    //     });
    //   });
    // });
  }

  renderPriceChart(items) {

    this.zone.runOutsideAngular(() => {
      const chart = AmCharts.makeChart( 'tv_chart_container', {
        'type': 'serial',
        'theme': 'dark',
        minSelectedTime: 60000,
        'valueAxes': [ {
          'position': 'left'
        } ],
        'graphs': [ {
          'id': 'g1',
          'balloonText': 'Open:<b>[[open]]</b><br>Low:<b>[[low]]</b><br>High:<b>[[high]]</b><br>Close:<b>[[close]]</b><br>',
          'closeField': 'close',
          'fillColors': '#4bf5c6',
          'highField': 'high',
          'lineColor': '#4bf5c6',
          'lineAlpha': 1,
          'lowField': 'low',
          'fillAlphas': 1,
          'negativeFillColors': '#ff7e70',
          'negativeLineColor': '#ff7e70',
          'openField': 'open',
          'title': 'Price:',
          'type': 'candlestick',
          'valueField': 'close'
        } ],
        'chartScrollbar': {
          // dragIcon: 'dragIconRoundSmallBlack',
          'graph': 'g1',
          'graphType': 'line',
          'scrollbarHeight': 30,
          graphFillAlpha: .1,
          selectedGraphFillAlpha: .1
        },
        'chartCursor': {
          'valueLineEnabled': true,
          'valueLineBalloonEnabled': true
        },
        'categoryField': 'date',
        'categoryAxis': {
          dateFormats: [
            {'period':'fff','format':'JJ:NN:SS'},
            {'period':'ss','format':'JJ:NN:SS'},
            {'period':'mm','format':'JJ:NN'},
            {'period':'hh','format':'JJ:NN'},
            {'period':'DD','format':'MMM DD'},
            {'period':'WW','format':'MMM DD'},
            {'period':'MM','format':'MMM'},
            {'period':'YYYY','format':'YYYY'}],
          parseDates: true,
          minPeriod: '1mm'
        },
        dataProvider: items
          .map(i => Object.assign({}, i, {
            date: moment(i.time).toDate()
          })),
        // dataProvider: sampleData
        //   .map(d => Object.assign({}, d, {
        //     date: moment(d.date).toISOString()
        //   })),
        'export': {
          'enabled': true,
          'position': 'bottom-right'
        }
      } );

      chart.addListener( 'rendered', zoomChart );
      zoomChart();

      // this method is called when chart is first inited as we listen for 'dataUpdated' event
      function zoomChart() {
        // different zoom methods can be used - zoomToIndexes, zoomToDates, zoomToCategoryValues
        chart.zoomToIndexes( chart.dataProvider.length - 50, chart.dataProvider.length - 1 );
      }
    });
  }

}
