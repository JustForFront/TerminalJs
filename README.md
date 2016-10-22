# TerminalJs

TerminalJs enable javascript applications to change states with command or url

See App.ts for basic usage.

## Roadmap
- [x] 2016-09 wk 5 **Unit testes**
- [X] 2016-10 wk 1 **Rewrite command system**
- [X] 2016-10 wk 2 **Command tracer**
- [ ] 2016-10 wk 3 Document
- [ ] 2016-10 wk 4 1.0 Beta

## Introduction

State management should be easy and flexible. TerminalJs is created under this believe. It simply maintains all the states value under one tree and selectively sync them to URL. Then you control them through simple commands from Javascript call or anchor DOM attribute. Since it sync states to URL, all states changes are traceable, reversible and sharable. Thus your states will be in control and you may just focus on their changes callbacks to create actual app behaviors. Give it five minutes to see how it change the way you build apps.

### It’s a terminal!

Once all state changing attempts were able to run in form of commands, coding and tracing will be easier then ever. All simple value manipulation commands are pre-defined, additional commands are also welcome to fit any usage.

### It manage URL!

Delegated states are synced with URL. It enable the browser back, forward and bookmark features out of box. Plus the current URL could be share to anyone in any platform you like without any additional code.

### It’s flexible & lightweight!

The package just got one single file in AMD or CMD package with ~30KB non-compressed file size. It preserve room for your favorite UI / MVVM frameworks to work with.
